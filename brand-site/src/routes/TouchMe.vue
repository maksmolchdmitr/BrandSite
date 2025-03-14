<template>
  <div className="mainContainer">
    <HeadBar :headItems="headItems"></HeadBar>
    <div className="container" ref="linksContainer">
      <Link v-if="currentLink" :logoImg="currentLink.img" :logoRef="currentLink.ref"
            :logo-text="currentLink.text"></Link>
    </div>
    <div class="startRouletteContainer" @click="startRoulette">
      <img class="circle" alt="-" src="@/assets/CircleLinker.svg"/>
      <span class="spin-text">Spin</span>
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
      headItems: [
        {
          text: 'Main',
          ref: '/',
          isMainSwitch: false
        },
        {
          text: 'Touch me',
          ref: '/contact',
          isMainSwitch: true
        },
        {
          text: 'Products',
          ref: '/products',
          isMainSwitch: false
        }
      ],
      links: [
        {
          img: tgImgSource,
          text: "Telegram",
          ref: "https://t.me/maksmolch",
        },
        {
          img: linkedInImgSource,
          text: "LinkedIn",
          ref: "https://www.linkedin.com/in/maksmolch/",
        },
        {
          img: figmaImgSource,
          text: "Figma",
          ref: "https://www.figma.com/design/Ke4H9o65cODhhC2crnZmPy/MaksMolch-brend-site?node-id=0-1&t=1qM5NcQafVqDU1hM-0",
        },
        {
          img: gmailImgSource,
          text: "Gmail",
          ref: "mailto:maksmolchdmitr@gmail.com",
        },
        {
          img: githubImgSource,
          text: "Github",
          ref: "https://github.com/maksmolchdmitr",
        },
      ],
      currentIndex: 0
    }
  },
  computed: {
    currentLink() {
      this.currentIndex = Math.floor(Math.random() * this.links.length);
      return this.links[this.currentIndex];
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
}

.mainContainer {
  display: flex;
  flex-direction: column;
  gap: 100px;
}

.circle {
  width: 100px;
  height: 100px;
  cursor: pointer;
  transition: filter 0.3s;
}

.startRouletteContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.circle {
  display: block;
}

.spin-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold; /* Жирность текста */
  pointer-events: none; /* Чтобы текст не мешал кликать по изображению */
  font-size: 24px;
  color: black;
  font-family: Mali, serif;
}

.circle:hover {
  transform: scale(1.1);
  filter: brightness(90%);
}

.circle:active {
  filter: brightness(70%);
}

@media (max-width: 768px) {
  .container {
    height: 150px; /* Adjusted height for smaller screens */
  }

  .mainContainer {
    gap: 50px;
  }
}
</style>