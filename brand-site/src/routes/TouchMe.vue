<template>
  <div class="mainContainer">
    <HeadBar :headItems="localizedHeadItems"></HeadBar>
    <div class="container" :class="{ isGallery: isGalleryOpen }" ref="linksContainer">
      <div v-if="isGalleryOpen" class="linksGrid">
        <Link
          v-for="(link, index) in localizedLinks"
          :key="index"
          :logoImg="link.img"
          :logoRef="link.ref"
          :logo-text="link.text"
          :is-compact="true"
        ></Link>
      </div>
      <Link
        v-else-if="currentLink"
        :logoImg="currentLink.img"
        :logoRef="currentLink.ref"
        :logo-text="currentLink.text"
      ></Link>
    </div>
    <div
      class="startRouletteContainer"
      @click="startRoulette"
      @pointerdown="onSpinPressStart"
      @pointerup="onSpinPressEnd"
      @pointercancel="onSpinPressEnd"
      @contextmenu.prevent
    >
      <img class="circle" :alt="$t('touchMe.spinAlt')" src="@/assets/CircleLinker.svg"/>
      <span class="spin-text">{{ $t('touchMe.spin') }}</span>
    </div>
  </div>
</template>

<script>
import HeadBar from "@/components/HeadBar.vue";
import Link from "@/components/Link.vue";
import tgImgSource from "@/assets/logo/Telegram.svg";
import figmaImgSource from "@/assets/logo/Figma.svg";
import gmailImgSource from "@/assets/logo/Gmail.svg";
import linkedInImgSource from "@/assets/logo/LinkedIn.svg";
import githubImgSource from "@/assets/logo/Github.svg";

const HOLD_DELAY_MS = 250;

export default {
  methods: {
    onSpinPressStart(event) {
      event.currentTarget.setPointerCapture(event.pointerId);
      this.skipClick = false;
      this.clearPressTimer();
      this.pressTimer = window.setTimeout(() => {
        this.isGalleryOpen = true;
        this.skipClick = true;
      }, HOLD_DELAY_MS);
    },
    onSpinPressEnd(event) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      this.clearPressTimer();
    },
    closeGallery() {
      this.isGalleryOpen = false;
    },
    clearPressTimer() {
      if (this.pressTimer) {
        window.clearTimeout(this.pressTimer);
        this.pressTimer = null;
      }
    },
    startRoulette() {
      if (this.skipClick || this.isSpinning) {
        this.skipClick = false;
        return;
      }

      if (this.isGalleryOpen) {
        this.closeGallery();
        return;
      }

      const links = this.links;
      let currentIndex = this.currentIndex;
      const interval = 100;
      const rounds = Math.floor(Math.random() * 9) + 5;
      const totalSteps = rounds * links.length + Math.floor(Math.random() * links.length);
      let stepsTaken = 0;

      this.isSpinning = true;

      const rouletteInterval = window.setInterval(() => {
        currentIndex = (currentIndex + 1) % links.length;
        this.currentIndex = currentIndex;
        stepsTaken++;

        if (stepsTaken >= totalSteps) {
          window.clearInterval(rouletteInterval);
          this.isSpinning = false;
        }
      }, interval);
    }
  },
  components: {Link, HeadBar},
  mounted() {
    this.currentIndex = Math.floor(Math.random() * this.links.length);
  },
  beforeUnmount() {
    this.clearPressTimer();
  },
  data() {
    return {
      links: [
        {
          img: tgImgSource,
          textKey: "touchMe.links.telegram",
          ref: "https://t.me/maksmolch",
        },
        {
          img: linkedInImgSource,
          textKey: "touchMe.links.linkedIn",
          ref: "https://www.linkedin.com/in/maksmolch/",
        },
        {
          img: figmaImgSource,
          textKey: "touchMe.links.figma",
          ref: "https://www.figma.com/design/Ke4H9o65cODhhC2crnZmPy/MaksMolch-brend-site?node-id=0-1&t=1qM5NcQafVqDU1hM-0",
        },
        {
          img: gmailImgSource,
          textKey: "touchMe.links.gmail",
          ref: "mailto:maksmolchdmitr@gmail.com",
        },
        {
          img: githubImgSource,
          textKey: "touchMe.links.github",
          ref: "https://github.com/maksmolchdmitr",
        },
      ],
      currentIndex: 0,
      isGalleryOpen: false,
      isSpinning: false,
      skipClick: false,
      pressTimer: null,
    }
  },
  computed: {
    localizedHeadItems() {
      return [
        { text: this.$t('common.nav.main'), ref: '/?page=main', isMainSwitch: false },
        { text: this.$t('common.nav.touchMe'), ref: '/?page=contact', isMainSwitch: true },
        { text: this.$t('common.nav.products'), ref: '/?page=products', isMainSwitch: false },
      ];
    },
    localizedLinks() {
      return this.links.map((item) => ({
        ...item,
        text: this.$t(item.textKey),
      }));
    },
    currentLink() {
      return this.localizedLinks[this.currentIndex] ?? null;
    }
  }
}
</script>

<style scoped>
html {
  scroll-behavior: smooth;
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  overflow: hidden;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0 16px;
}

.container.isGallery {
  min-height: 240px;
  align-items: stretch;
}

.linksGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

.mainContainer {
  display: flex;
  flex-direction: column;
  gap: 100px;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
  padding-bottom: 24px;
}

.startRouletteContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto;
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.3s ease;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

.circle {
  width: 100px;
  height: 100px;
  display: block;
  transition: filter 0.3s ease;
}

.spin-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  pointer-events: none;
  font-size: 24px;
  color: black;
  font-family: var(--font-display);
}

.startRouletteContainer:hover {
  transform: scale(1.1);
}

.startRouletteContainer:hover .circle {
  filter: brightness(90%);
}

.startRouletteContainer:active {
  transform: scale(1.05);
}

.startRouletteContainer:active .circle {
  filter: brightness(70%);
}

@media (max-width: 768px) {
  .container {
    min-height: 150px;
  }

  .container.isGallery {
    min-height: 220px;
  }

  .linksGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .mainContainer {
    gap: 50px;
    padding-bottom: 16px;
  }

  .startRouletteContainer {
    width: 80px;
    height: 80px;
  }

  .circle {
    width: 80px;
    height: 80px;
  }

  .spin-text {
    font-size: 18px;
  }
}

@media (prefers-color-scheme: dark) {
  .spin-text {
    color: #1f1f1f;
  }
}
</style>
