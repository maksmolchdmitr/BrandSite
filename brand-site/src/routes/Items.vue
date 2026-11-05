<template>
  <div class="itemsPage">
    <HeadBar :headItems="headItems" />
    <section class="itemsContent">
      <RouterLink class="backLink" :to="item ? catalogLink : '/?page=products'">
        {{ $t(item ? 'items.backToItems' : 'common.actions.backToProducts') }}
      </RouterLink>
      <header class="pageIntro">
        <h1>{{ $t(item ? item.name : 'items.title') }}</h1>
      </header>

      <ul v-if="!item" class="catalog" :aria-label="$t('items.chooseItem')">
        <li v-for="entry in items" :key="entry.slug">
          <RouterLink class="itemCard" :to="{ query: { page: 'items', item: entry.slug } }">
            <img :src="assetUrl(entry, 'poster.webp')" alt="" width="300" height="300" />
            <strong>{{ $t(entry.name) }}</strong>
          </RouterLink>
        </li>
      </ul>

      <div v-else ref="exhibit" class="exhibit" :class="{ expanded }">
        <div class="stage" :class="{ turning: viewerState.dragging }" :aria-busy="loading">
          <div ref="viewport" class="viewport" :class="{ concealed: !viewerState.ready || failed }" />
          <div v-if="loading && !failed" class="stageOverlay" role="status">
            <img :src="assetUrl(item, 'poster.webp')" alt="" width="480" height="480" />
            <span class="loadingPill"><span class="loadingDot" />{{ $t('items.loading') }} {{ progress }}%</span>
          </div>
          <div v-if="failed" class="errorOverlay" role="alert">
            <p>{{ $t('items.loadError') }}</p>
            <button class="primaryButton" type="button" @click="loadViewer">{{ $t('items.retry') }}</button>
          </div>
          <div v-if="canControl" class="stageTopline">
            <span class="liveBadge"><span />{{ $t(viewerState.playing && viewerState.speed > 0 ? 'items.live' : 'items.paused') }}</span>
            <div ref="viewButtons" class="viewButtons">
              <button
                class="iconButton helpButton"
                type="button"
                :aria-label="$t('items.cameraHelp')"
                :aria-expanded="helpOpen || helpHeld"
                aria-controls="camera-help"
                @click="helpOpen = !helpOpen"
                @pointerdown="helpHeld = true"
                @pointerup="helpHeld = false"
                @pointerleave="helpHeld = false"
                @pointercancel="helpHeld = false"
                @contextmenu.prevent
              >?</button>
              <div v-show="helpOpen || helpHeld" id="camera-help" class="helpPanel">
                <strong>{{ $t('items.cameraHelp') }}</strong>
                <p>{{ $t('items.cameraKeyboard') }}</p>
                <p>{{ $t('items.cameraGamepad') }}</p>
                <p>{{ $t('items.petRabbit') }}</p>
              </div>
              <button class="iconButton" type="button" :title="$t('items.resetView')" :aria-label="$t('items.resetView')" @click="viewer?.resetView()">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2.8 9M3 4v6h6" /></svg>
              </button>
              <button class="iconButton" type="button" :title="fullscreenLabel" :aria-label="fullscreenLabel" @click="toggleFullscreen">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path v-if="fullscreen" d="M9 3v6H3m12-6v6h6M9 21v-6H3m12 6v-6h6" />
                  <path v-else d="M9 3H3v6m12-6h6v6M9 21H3v-6m12 6h6v-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-if="canControl || audioFailed" ref="soundControls" class="exhibitControls">
          <div v-if="volumeOpen && canControl" ref="volumePanel" class="volumePanel" role="group" :aria-label="$t('items.volume')">
            <label v-for="channel in volumeChannels" :key="channel">
              <span>{{ $t(`items.volumeChannels.${channel}`) }} <strong>{{ viewerState.volumes[channel] }}%</strong></span>
              <input type="range" min="0" max="100" :value="viewerState.volumes[channel]" @input="setVolume(channel, $event)" />
            </label>
          </div>
          <div class="controlHeading">
            <div class="playbackButtons">
              <button class="iconButton" type="button" :disabled="!canControl || viewerState.speed === 0" :aria-label="$t(isRunning ? 'items.pause' : 'items.play')" :title="$t(isRunning ? 'items.pause' : 'items.play')" @click="togglePlaying">
                <svg v-if="isRunning" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14" /></svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" /></svg>
              </button>
              <button class="soundButton" data-garden-sound type="button" :disabled="!canControl" :aria-pressed="soundAudible"
                :aria-expanded="volumeOpen"
                :title="$t('items.volumeHint')"
                @pointerdown="startSoundHold"
                @pointerup="cancelSoundHold"
                @pointerleave="cancelSoundHold"
                @pointercancel="cancelSoundHold"
                @contextmenu.prevent
                @keydown.arrow-down.prevent="openVolumeWithKeyboard"
                @click="toggleSound">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5Z" /><path v-if="soundAudible" d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /><path v-else d="m16 9 6 6m0-6-6 6" /></svg>
                {{ $t(soundLabel) }}
              </button>
            </div>
          </div>
          <p v-if="audioFailed" class="audioWarning" role="status">{{ $t('items.audioError') }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { defineComponent, markRaw } from 'vue';
import HeadBar from '@/components/HeadBar.vue';
import { GARDEN_VOLUME_CHANNELS } from '@/items/gardenAudio.js';

const items = [{ slug: 'quiet-garden', name: 'items.gardenName' }];
const catalogLink = { query: { page: 'items' } };

export default defineComponent({
  components: { HeadBar },
  data() {
    return {
      items,
      catalogLink,
      loading: false,
      fullscreen: false,
      expanded: false,
      helpOpen: false,
      helpHeld: false,
      failed: false,
      audioFailed: false,
      volumeOpen: false,
      volumeChannels: GARDEN_VOLUME_CHANNELS,
      soundHoldTimer: null,
      soundHeld: false,
      progress: 0,
      viewer: null,
      destroyed: false,
      loadAttempt: 0,
      viewerState: { ready: false, speed: 1, playing: true, soundEnabled: true, audioReady: false, volumes: {}, dragging: false },
    };
  },
  computed: {
    item() { return items.find((entry) => entry.slug === this.$route.query.item); },
    headItems() {
      return [
        { text: this.$t('common.nav.main'), ref: '/?page=main', isMainSwitch: false },
        { text: this.$t('common.nav.touchMe'), ref: '/?page=contact', isMainSwitch: false },
        { text: this.$t('common.nav.products'), ref: '/?page=products', isMainSwitch: true },
      ];
    },
    fullscreenLabel() {
      return this.$t(this.fullscreen ? 'items.exitFullscreen' : 'items.enterFullscreen');
    },
    soundAudible() { return this.viewerState.soundEnabled && this.viewerState.audioReady; },
    soundLabel() {
      if (this.viewerState.soundEnabled && !this.viewerState.audioReady) return 'items.soundStart';
      return this.soundAudible ? 'items.soundOn' : 'items.soundOff';
    },
    canControl() { return this.viewerState.ready && !this.failed; },
    isRunning() { return this.viewerState.playing && this.viewerState.speed > 0; },
  },
  watch: {
    item(item) {
      this.exitExpanded();
      this.cancelSoundHold();
      this.volumeOpen = false;
      this.helpOpen = false;
      this.helpHeld = false;
      if (item) {
        void this.loadViewer();
      } else {
        this.loadAttempt++;
        this.viewer?.dispose();
        this.viewer = null;
      }
    },
  },
  mounted() {
    document.addEventListener('pointerdown', this.dismissVolume);
    document.addEventListener('fullscreenchange', this.syncFullscreen);
    document.addEventListener('keydown', this.handleFullscreenEscape);
    if (this.item) void this.loadViewer();
  },
  beforeUnmount() {
    this.cancelSoundHold();
    document.removeEventListener('pointerdown', this.dismissVolume);
    this.exitExpanded();
    document.removeEventListener('fullscreenchange', this.syncFullscreen);
    document.removeEventListener('keydown', this.handleFullscreenEscape);
    this.destroyed = true;
    this.loadAttempt++;
    this.viewer?.dispose();
  },
  methods: {
    syncFullscreen() {
      this.fullscreen = this.expanded || document.fullscreenElement === this.$refs.exhibit;
    },
    exitExpanded() {
      this.expanded = false;
      this.syncFullscreen();
    },
    handleFullscreenEscape(event) {
      if (event.key !== 'Escape') return;
      if (this.helpOpen || this.helpHeld) {
        this.helpOpen = false;
        this.helpHeld = false;
      } else if (this.volumeOpen) this.volumeOpen = false;
      else if (this.expanded) this.exitExpanded();
    },
    async toggleFullscreen() {
      const exhibit = this.$refs.exhibit;
      if (this.expanded) {
        this.exitExpanded();
      } else if (document.fullscreenElement === exhibit) {
        await document.exitFullscreen();
      } else {
        try {
          await exhibit.requestFullscreen();
        } catch {
          if (exhibit !== this.$refs.exhibit || this.destroyed) return;
          this.expanded = true;
          this.syncFullscreen();
        }
      }
    },

    assetUrl(item, file) {
      return `${import.meta.env.BASE_URL}items/${item.slug}/${file}`;
    },
    async loadViewer() {
      const item = this.item;
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
        await this.viewer.load(this.assetUrl(item, `${item.slug}.glb`));
      } catch (_) {
        if (!this.destroyed && attempt === this.loadAttempt) { this.failed = true; this.loading = false; }
      }
    },
    togglePlaying() { this.viewer?.setPlaying(!this.isRunning); },
    startSoundHold(event) {
      if (event.button !== 0 || !event.isPrimary) return;
      this.cancelSoundHold();
      this.soundHeld = false;
      this.soundHoldTimer = setTimeout(() => {
        this.soundHeld = true;
        this.volumeOpen = true;
      }, 500);
    },
    cancelSoundHold() {
      clearTimeout(this.soundHoldTimer);
      this.soundHoldTimer = null;
    },
    async openVolumeWithKeyboard() {
      this.volumeOpen = true;
      await this.$nextTick();
      this.$refs.volumePanel?.querySelector('input')?.focus();
    },
    dismissVolume(event) {
      if (!this.$refs.soundControls?.contains(event.target)) this.volumeOpen = false;
      if (!this.$refs.viewButtons?.contains(event.target)) this.helpOpen = false;
    },
    setVolume(channel, event) {
      this.viewer?.setVolume(channel, event.target.valueAsNumber);
    },
    toggleSound(event) {
      if (event.detail > 0 && this.soundHeld) {
        this.soundHeld = false;
        return;
      }
      this.audioFailed = false;
      this.viewer?.toggleSound();
    },
  },
});
</script>

<style scoped>
.itemsPage { font-family: var(--font-display); }
.itemsContent { max-width: 1420px; margin: 0 auto; padding: 24px 50px 60px; box-sizing: border-box; }
.backLink { display: inline-block; color: #555; font-size: 16px; text-decoration: none; padding: 8px 0; }
.backLink:hover { color: #4f3dff; }
.pageIntro { margin: 28px 0 30px; }
h1 { font-size: clamp(38px, 5vw, 64px); line-height: 1.1; margin: 0; font-weight: 700; }
.catalog { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 260px)); gap: 16px; }
.itemCard { text-decoration: none; box-sizing: border-box; position: relative; display: flex; flex-direction: column; align-items: flex-start; width: 100%; border: 2px solid transparent; border-radius: 28px; padding: 20px; background: #fff; color: #252e22; font: inherit; text-align: left; cursor: pointer; transition: border-color .2s, transform .2s; }
.itemCard:hover { transform: translateY(-3px); }
.itemCard img { width: 100%; height: 235px; object-fit: contain; margin: 4px 0 16px; }
.itemCard strong { margin-top: 7px; font-size: 28px; }
.exhibit { position: relative; min-width: 0; overflow: hidden; border-radius: 32px; }
.stage { position: relative; isolation: isolate; height: clamp(450px, 63vh, 680px); background: radial-gradient(ellipse at 50% 42%, #3a514c 0%, #263b38 54%, #142326 100%); }
.stage.turning { box-shadow: inset 0 0 0 3px #a7bd8e; }
.viewport { position: absolute; inset: 0; }
.viewport.concealed { visibility: hidden; }
.viewport :deep(canvas) { display: block; width: 100%; height: 100%; outline: none; }
.stageOverlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.stageOverlay img { width: 80%; height: 82%; object-fit: contain; }
.primaryButton { border: 0; border-radius: 100px; padding: 13px 24px; background: #4f3dff; color: white; font: inherit; font-weight: 700; font-size: 17px; cursor: pointer; }
.primaryButton:hover { background: #4030db; }
.stageOverlay { pointer-events: none; }
.stageOverlay img { opacity: .65; }
.loadingPill { display: flex; align-items: center; gap: 9px; position: absolute; bottom: 24px; padding: 10px 18px; border-radius: 99px; background: #fff; color: #3d4935; }
.loadingDot, .liveBadge span { width: 7px; height: 7px; border-radius: 50%; background: #6c8851; }
.stageTopline { position: absolute; top: 18px; right: 18px; left: 22px; display: flex; justify-content: space-between; align-items: center; pointer-events: none; }
.viewButtons { display: flex; gap: 8px; }
.helpButton { font-weight: 700; touch-action: manipulation; user-select: none; -webkit-touch-callout: none; }
.helpPanel {
  position: absolute;
  z-index: 2;
  top: 50px;
  right: 0;
  width: min(315px, 100%);
  box-sizing: border-box;
  padding: 14px;
  border-radius: 14px;
  color: #35402c;
  background: #f7f9f3;
  font-size: 14px;
}
.helpPanel p { margin: 8px 0 0; line-height: 1.4; }
.stageTopline > * { pointer-events: auto; }
.liveBadge { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #e4eddd; }
.iconButton, .soundButton { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 42px; padding: 0 12px; border: 1px solid #e1e5dc; border-radius: 14px; color: #35402c; background: #f7f9f3; font: inherit; cursor: pointer; }
.iconButton { width: 42px; padding: 0; flex-shrink: 0; }
.iconButton svg, .soundButton svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
button:disabled { opacity: .4; cursor: default; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 3px solid #877bff; outline-offset: 4px; }
.errorOverlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 28px; background: #edf1e6; color: #3d4935; text-align: center; }
.exhibitControls { position: absolute; right: 18px; bottom: 18px; }
.soundButton { touch-action: manipulation; user-select: none; -webkit-touch-callout: none; }
.volumePanel {
  display: grid;
  gap: 10px;
  margin-bottom: 8px;
  padding: 12px;
  width: 200px;
  max-height: min(45vh, 320px);
  overflow-y: auto;
  border-radius: 14px;
  color: #35402c;
  background: #f7f9f3;
}
.volumePanel label { display: grid; gap: 4px; }
.volumePanel span { display: flex; justify-content: space-between; gap: 8px; }
.volumePanel input { width: 100%; margin: 0; accent-color: #647b50; }
.controlHeading { display: flex; justify-content: flex-end; }
.playbackButtons { display: flex; gap: 8px; }
.liveBadge span { background: #b7d590; }
.audioWarning { color: #f5cd98; font-size: 14px; }
@media(max-width: 1000px) {
  .itemsContent { padding: 20px 24px 40px; }
  .itemCard { padding: 16px; }
  .itemCard img { height: 190px; }
}
@media(max-width: 700px) {
  .itemsContent { padding: 12px 16px 32px; }
  .pageIntro { margin: 18px 0 22px; }
  .catalog { grid-template-columns: 1fr; }
  .itemCard { min-height: 100px; justify-content: center; padding: 16px 16px 16px 100px; border-radius: 22px; }
  .itemCard img { position: absolute; left: 8px; top: 8px; width: 80px; height: 80px; margin: 0; }
  .itemCard strong { font-size: 25px; }
  .exhibit { border-radius: 24px; }
  .stage { height: 490px; max-height: 70svh; min-height: 360px; }
  .playbackButtons { margin-left: auto; }
  .soundButton { font-size: 13px; padding: 0 10px; }
}
.exhibit:fullscreen, .exhibit.expanded {
  display: flex;
  flex-direction: column;
  border-radius: 0;
}
.exhibit.expanded {
  position: fixed;
  inset: 0;
  z-index: 1000;
}
.exhibit:fullscreen .stage, .exhibit.expanded .stage {
  flex: 1;
  height: auto;
  min-height: 0;
  max-height: none;
}
@media(prefers-color-scheme: dark) {
  .backLink { color: #b5bcb1; }
  .itemCard { background: #292d27; color: #eef1e9; }
  .iconButton, .soundButton, .volumePanel, .helpPanel { background: #343c2f; color: #e1e9da; border-color: #4a5444; }
}
@media(prefers-reduced-motion: reduce) {
  .itemCard { transition: none; }
  .itemCard:hover { transform: none; }
}
</style>
