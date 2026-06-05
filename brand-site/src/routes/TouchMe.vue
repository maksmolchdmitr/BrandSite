<template>
  <div class="mainContainer">
    <HeadBar :headItems="localizedHeadItems"></HeadBar>
    <div class="container" ref="linksContainer">
      <Link v-if="currentLink" :logoImg="currentLink.img" :logoRef="currentLink.ref"
            :logo-text="currentLink.text"></Link>
    </div>
    <div class="startRouletteContainer" @click="startRoulette">
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

export default {
  methods: {
    startRoulette() {
      const links = this.links;
      let currentIndex = this.currentIndex;
      const interval = 100; // Speed of the roulette
      const rounds = Math.floor(Math.random() * 9) + 5; // Random number of full rounds between 5 and 13
      const totalSteps = rounds * links.length + Math.floor(Math.random() * links.length);
      let stepsTaken = 0;

      const rouletteInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % links.length;
        this.currentIndex = currentIndex;
        stepsTaken++;

        if (stepsTaken >= totalSteps) {
          clearInterval(rouletteInterval);
          // Optionally, you can trigger a click or highlight the selected link here
        }
      }, interval);
    }
  },
  components: {Link, HeadBar},
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
      currentIndex: 0
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
      this.currentIndex = Math.floor(Math.random() * this.localizedLinks.length);
      return this.localizedLinks[this.currentIndex];
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
  height: 200px; /* Adjusted height to fit one link */
  overflow: hidden;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
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
    height: 150px; /* Adjusted height for smaller screens */
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