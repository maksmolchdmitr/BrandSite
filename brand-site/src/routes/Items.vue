<template>
  <div class="itemsPage">
    <HeadBar :headItems="headItems" />
    <section class="itemsContent">
      <RouterLink class="backLink" to="/?page=products">{{ $t('common.actions.backToProducts') }}</RouterLink>
      <header class="pageIntro">
        <div>
          <p class="eyebrow">{{ $t('items.collection') }}</p>
          <h1>{{ $t('items.title') }}</h1>
        </div>
        <p class="introText">{{ $t('items.intro') }}</p>
      </header>

      <div class="collectionLayout">
        <aside class="catalog" :aria-label="$t('items.chooseItem')">
          <button
            class="itemCard"
            :class="{ selected: selected }"
            type="button"
            :aria-pressed="selected"
            @click="selectItem"
          >
            <span class="itemNumber">001</span>
            <img :src="poster" :alt="$t('items.gardenName')" width="300" height="300" />
            <span class="cardCategory">{{ $t('items.gardenCategory') }}</span>
            <strong>{{ $t('items.gardenName') }}</strong>
            <span class="cardDescription">{{ $t('items.gardenDescription') }}</span>
            <span class="cardAction">{{ $t(selected ? 'items.selected' : 'items.inspect') }} <span aria-hidden="true">↗</span></span>
          </button>
        </aside>

        <div class="exhibit">
          <div class="stage" :class="{ turning: viewerState.dragging }" :aria-busy="loading">
            <div v-if="!selected" class="stageInvitation">
              <img :src="poster" alt="" width="640" height="640" />
              <button type="button" class="primaryButton" @click="selectItem">{{ $t('items.inspect') }} <span aria-hidden="true">↗</span></button>
            </div>
            <div ref="viewport" class="viewport" :class="{ concealed: !selected || !viewerState.ready || failed }" />
            <div v-if="selected && loading && !failed" class="stageOverlay" role="status">
              <img :src="poster" alt="" width="480" height="480" />
              <span class="loadingPill"><span class="loadingDot" />{{ $t('items.loading') }} {{ progress }}%</span>
            </div>
            <div v-if="failed" class="errorOverlay" role="alert">
              <p>{{ $t('items.loadError') }}</p>
              <button class="primaryButton" type="button" @click="loadViewer">{{ $t('items.retry') }}</button>
            </div>
            <div v-if="canControl" class="stageTopline">
              <span class="liveBadge"><span />{{ $t(viewerState.playing && viewerState.speed > 0 ? 'items.live' : 'items.paused') }}</span>
              <button class="iconButton" type="button" :title="$t('items.resetView')" :aria-label="$t('items.resetView')" @click="viewer?.resetView()">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2.8 9M3 4v6h6" /></svg>
              </button>
            </div>
            <span v-if="canControl" class="dialHint" :class="{ active: viewerState.dragging }">{{ $t(viewerState.dragging ? 'items.turning' : 'items.dialHint') }}</span>
          </div>

          <div class="exhibitControls">
            <div class="controlHeading">
              <div><p class="eyebrow">{{ $t('items.objectNumber') }}</p><h2>{{ $t('items.gardenName') }}</h2></div>
              <div class="playbackButtons">
                <button class="iconButton" type="button" :disabled="!canControl" :aria-label="$t(isRunning ? 'items.pause' : 'items.play')" :title="$t(isRunning ? 'items.pause' : 'items.play')" @click="togglePlaying">
                  <svg v-if="isRunning" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>
                  <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" /></svg>
                </button>
                <button class="soundButton" type="button" :disabled="!canControl" :aria-pressed="viewerState.soundEnabled" @click="toggleSound">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5Z" /><path v-if="viewerState.soundEnabled" d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /><path v-else d="m16 9 6 6m0-6-6 6" /></svg>
                  {{ $t(viewerState.soundEnabled ? 'items.soundOn' : 'items.soundOff') }}
                </button>
              </div>
            </div>
            <div class="tempoControl">
              <label for="item-tempo">{{ $t('items.tempo') }}</label>
              <input id="item-tempo" type="range" min="0" max="3" step="0.01" :value="viewerState.speed" :disabled="!canControl" :aria-valuetext="formattedSpeed" @input="changeSpeed" />
              <output for="item-tempo">{{ formattedSpeed }}</output>
            </div>
            <p class="interactionGuide">{{ $t('items.guide') }}</p>
            <p v-if="audioFailed" class="audioWarning" role="status">{{ $t('items.audioError') }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { defineComponent, markRaw } from 'vue';
import HeadBar from '@/components/HeadBar.vue';

export default defineComponent({
  components: { HeadBar },
  data() {
    return {
      selected: false,
      loading: false,
      failed: false,
      audioFailed: false,
      progress: 0,
      viewer: null,
      destroyed: false,
      loadAttempt: 0,
      viewerState: { ready: false, speed: 1, playing: true, soundEnabled: false, dragging: false },
      poster: `${import.meta.env.BASE_URL}items/quiet-garden/poster.webp`,
    };
  },
  computed: {
    headItems() {
      return [
        { text: this.$t('common.nav.main'), ref: '/?page=main', isMainSwitch: false },
        { text: this.$t('common.nav.touchMe'), ref: '/?page=contact', isMainSwitch: false },
        { text: this.$t('common.nav.products'), ref: '/?page=products', isMainSwitch: true },
      ];
    },
    canControl() { return this.viewerState.ready && !this.failed; },
    isRunning() { return this.viewerState.playing && this.viewerState.speed > 0; },
    formattedSpeed() { return `${new Intl.NumberFormat(this.$i18n.locale, { maximumFractionDigits: 2 }).format(this.viewerState.speed)}×`; },
  },
  beforeUnmount() {
    this.destroyed = true;
    this.loadAttempt++;
    this.viewer?.dispose();
  },
  methods: {
    selectItem() {
      if (this.selected) return;
      this.selected = true;
      void this.loadViewer();
    },
    async loadViewer() {
      const attempt = ++this.loadAttempt;
      this.viewer?.dispose();
      this.viewer = null;
      this.failed = false;
      this.audioFailed = false;
      this.loading = true;
      this.progress = 0;
      this.viewerState.ready = false;
      try {
        const { createItemViewer } = await import('@/items/createItemViewer.js');
        await this.$nextTick();
        if (this.destroyed || attempt !== this.loadAttempt) return;
        this.viewer = markRaw(createItemViewer(this.$refs.viewport, {
          label: this.$t('items.viewerLabel'),
          onState: (state) => {
            if (this.destroyed || attempt !== this.loadAttempt) return;
            this.viewerState = state;
            if (state.ready) this.loading = false;
          },
          onProgress: (progress) => { if (!this.destroyed && attempt === this.loadAttempt) this.progress = progress; },
          onError: () => { if (!this.destroyed && attempt === this.loadAttempt) { this.failed = true; this.loading = false; } },
          onAudioError: () => { if (!this.destroyed && attempt === this.loadAttempt) this.audioFailed = true; },
        }));
        await this.viewer.load(`${import.meta.env.BASE_URL}items/quiet-garden/quiet-garden.glb`);
      } catch (_) {
        if (!this.destroyed && attempt === this.loadAttempt) { this.failed = true; this.loading = false; }
      }
    },
    changeSpeed(event) { this.viewer?.setSpeed(Number(event.target.value)); },
    togglePlaying() { this.viewer?.setPlaying(!this.isRunning); },
    toggleSound() { this.audioFailed = false; this.viewer?.toggleSound(); },
  },
});
</script>

<style scoped>
.itemsPage { font-family: var(--font-display); }
.itemsContent { max-width: 1420px; margin: 0 auto; padding: 24px 50px 60px; box-sizing: border-box; }
.backLink { display: inline-block; color: #555; font-size: 16px; text-decoration: none; padding: 8px 0; }
.backLink:hover { color: #4f3dff; }
.pageIntro { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin: 28px 0 30px; }
.eyebrow { margin: 0 0 8px; color: #67735e; font-size: 13px; letter-spacing: .09em; text-transform: uppercase; }
h1 { font-size: clamp(38px, 5vw, 64px); line-height: 1.1; margin: 0; font-weight: 700; }
.introText { max-width: 360px; margin: 0 0 4px; color: #5a5b56; font-size: 19px; line-height: 1.5; }
.collectionLayout { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 24px; align-items: start; }
.itemCard { position: relative; display: flex; flex-direction: column; align-items: flex-start; width: 100%; border: 2px solid transparent; border-radius: 28px; padding: 20px; background: #fff; color: #252e22; font: inherit; text-align: left; cursor: pointer; transition: border-color .2s, transform .2s; }
.itemCard:hover { transform: translateY(-3px); }
.itemCard.selected { border-color: #4f3dff; }
.itemNumber { color: #7e8779; font-size: 13px; }
.itemCard img { width: 100%; height: 235px; object-fit: contain; margin: 4px 0 16px; }
.cardCategory { color: #748168; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
.itemCard strong { margin-top: 7px; font-size: 28px; }
.cardDescription { color: #697063; font-size: 16px; line-height: 1.5; margin-top: 10px; }
.cardAction { display: flex; justify-content: space-between; width: 100%; color: #4f3dff; font-weight: 700; margin-top: 28px; font-size: 16px; }
.exhibit { min-width: 0; overflow: hidden; border-radius: 32px; background: #fff; }
.stage { position: relative; isolation: isolate; height: clamp(450px, 63vh, 680px); background: radial-gradient(ellipse at 50% 40%, #f6f8f0 0%, #e8eee1 58%, #d9e3d0 100%); }
.stage.turning { box-shadow: inset 0 0 0 3px #a7bd8e; }
.viewport { position: absolute; inset: 0; }
.viewport.concealed { visibility: hidden; }
.viewport :deep(canvas) { display: block; width: 100%; height: 100%; outline: none; }
.stageInvitation, .stageOverlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.stageInvitation img, .stageOverlay img { width: 80%; height: 82%; object-fit: contain; }
.stageInvitation .primaryButton { position: absolute; bottom: 22px; }
.primaryButton { border: 0; border-radius: 100px; padding: 13px 24px; background: #4f3dff; color: white; font: inherit; font-weight: 700; font-size: 17px; cursor: pointer; }
.primaryButton:hover { background: #4030db; }
.stageOverlay { pointer-events: none; }
.stageOverlay img { opacity: .65; }
.loadingPill { display: flex; align-items: center; gap: 9px; position: absolute; bottom: 24px; padding: 10px 18px; border-radius: 99px; background: #fff; color: #3d4935; }
.loadingDot, .liveBadge span { width: 7px; height: 7px; border-radius: 50%; background: #6c8851; }
.stageTopline { position: absolute; top: 18px; right: 18px; left: 22px; display: flex; justify-content: space-between; align-items: center; pointer-events: none; }
.stageTopline > * { pointer-events: auto; }
.liveBadge { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #4c5e40; }
.iconButton, .soundButton { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 42px; padding: 0 12px; border: 1px solid #e1e5dc; border-radius: 14px; color: #35402c; background: #f7f9f3; font: inherit; cursor: pointer; }
.iconButton { width: 42px; padding: 0; flex-shrink: 0; }
.iconButton svg, .soundButton svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
button:disabled { opacity: .4; cursor: default; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 3px solid #877bff; outline-offset: 4px; }
.dialHint { position: absolute; bottom: 18px; left: 18px; max-width: 180px; border-radius: 100px; padding: 10px 18px; background: #ffffffd9; color: #4a5b3c; font-size: 14px; text-align: center; white-space: normal; pointer-events: none; }
.dialHint.active { background: #4e6440; color: white; }
.errorOverlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 28px; background: #edf1e6; color: #3d4935; text-align: center; }
.exhibitControls { padding: 24px 28px 22px; }
.controlHeading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.controlHeading h2 { margin: 0; font-size: 30px; line-height: 1.2; }
.playbackButtons { display: flex; gap: 8px; }
.tempoControl { display: grid; grid-template-columns: auto minmax(60px, 1fr) 48px; align-items: center; gap: 18px; margin-top: 24px; }
.tempoControl input { width: 100%; margin: 0; accent-color: #4f3dff; cursor: pointer; height: 28px; }
.tempoControl output { font-variant-numeric: tabular-nums; text-align: right; font-size: 18px; }
.interactionGuide { margin: 14px 0 0; font-size: 14px; line-height: 1.6; color: #71776b; }
.audioWarning { color: #966526; font-size: 14px; }
@media(max-width: 1000px) {
  .itemsContent { padding: 20px 24px 40px; }
  .collectionLayout { grid-template-columns: 210px minmax(0, 1fr); gap: 16px; }
  .itemCard { padding: 16px; }
  .itemCard img { height: 190px; }
  .exhibitControls { padding: 22px; }
}
@media(max-width: 700px) {
  .itemsContent { padding: 12px 16px 32px; }
  .pageIntro { display: block; margin: 18px 0 22px; }
  .introText { font-size: 17px; max-width: none; margin: 16px 0 0; }
  .collectionLayout { grid-template-columns: minmax(0, 1fr); }
  .itemCard { min-height: 125px; padding: 16px 16px 16px 116px; border-radius: 22px; }
  .itemCard img { position: absolute; left: 8px; top: 8px; width: 100px; height: 118px; margin: 0; }
  .itemNumber, .cardCategory, .cardDescription { display: none; }
  .itemCard strong { font-size: 25px; }
  .cardAction { margin-top: 15px; }
  .exhibit { border-radius: 24px; }
  .stage { height: 490px; max-height: 70svh; min-height: 360px; }
  .controlHeading { align-items: start; flex-wrap: wrap; }
  .controlHeading h2 { font-size: 27px; }
  .playbackButtons { margin-left: auto; }
  .soundButton { font-size: 13px; padding: 0 10px; }
  .dialHint { white-space: normal; width: max-content; max-width: calc(100% - 52px); font-size: 13px; }
  .tempoControl { gap: 12px; }
  .exhibitControls { padding: 20px; }
}
@media(prefers-color-scheme: dark) {
  .backLink, .introText { color: #b5bcb1; }
  .eyebrow { color: #a9b99b; }
  .itemCard, .exhibit { background: #292d27; color: #eef1e9; }
  .cardCategory, .cardDescription, .interactionGuide { color: #b4bfaa; }
  .cardAction { color: #b8b0ff; }
  .iconButton, .soundButton { background: #343c2f; color: #e1e9da; border-color: #4a5444; }
  .stage { background: radial-gradient(ellipse at 50% 40%, #3c4933, #273120); }
  .liveBadge { color: #dae7cf; }
}
@media(prefers-reduced-motion: reduce) {
  .itemCard { transition: none; }
  .itemCard:hover { transform: none; }
}
</style>
