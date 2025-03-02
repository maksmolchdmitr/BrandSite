<template>
  <div className="mainContainer">
    <HeadBar :headItems="headItems"></HeadBar>
    <div className="container" ref="linksContainer">
      <template v-for="(link, index) in links" :key="link.id">
        <Link v-bind:logoImg="link.img" :logoRef="link.ref" v-bind:logo-text="link.text"></Link>
      </template>
    </div>
    <div class="startRouletteContainer">
      <img @click="startRoulette" class="circle" alt="-" src="@/assets/CircleLinker.svg"/>
      <span class="spin-text">Spin</span>
    </div>
  </div>
</template>

<script>
import HeadBar from "@/components/HeadBar.vue";
import LinkRefRect from "@/components/LinkRefRect.vue";
import CircleLinker from "@/components/CircleLinker.vue";
import Link from "@/components/Link.vue";
import tgImgSource from "@/assets/logo/Telegram.svg";
import figmaImgSource from "@/assets/logo/Figma.svg";
import vkImgSource from "@/assets/logo/VK.svg";
import gmailImgSource from "@/assets/logo/Gmail.svg";
import linkedInImgSource from "@/assets/logo/LinkedIn.svg";
import githubImgSource from "@/assets/logo/Github.svg";

export default {
  methods: {
    startRoulette() {
      const container = this.$refs.linksContainer;
      const links = this.links;
      let currentIndex = 0;
      const interval = 100; // Speed of the roulette
      const rounds = 5; // Number of full rounds
      const totalSteps = rounds * links.length + Math.floor(Math.random() * links.length);
      let stepsTaken = 0;

      const rouletteInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % links.length;
        container.scrollTop = (currentIndex * container.scrollHeight) / links.length;
        stepsTaken++;

        if (stepsTaken >= totalSteps) {
          clearInterval(rouletteInterval);
          // Optionally, you can trigger a click or highlight the selected link here
        }
      }, interval);
    }
  },
  components: {Link, CircleLinker, HeadBar, LinkRefRect},
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
          img: vkImgSource,
          text: "VK",
          ref: "https://vk.com/maksmolchdmitr",
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
      ]
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
  flex-direction: column;
  overflow-y: auto;
  height: 300px; /* Adjust height as needed */
  gap: 100px;
  padding-left: 100px;
  padding-right: 100px;
  justify-content: center;
  align-items: center;
}

.mainContainer {
  display: flex;
  flex-direction: column;
  gap: 100px;
}

.circle {
  width: 100px;
  height: 100px;
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
  color: black; /* Цвет текста */
  font-size: 24px; /* Размер текста */
  font-weight: bold; /* Жирность текста */
  pointer-events: none; /* Чтобы текст не мешал кликать по изображению */
}

@media (max-width: 768px) {
  .container {
    gap: 50px;
    padding-left: 50px;
    padding-right: 50px;
  }

  .mainContainer {
    gap: 50px;
  }
}
</style>