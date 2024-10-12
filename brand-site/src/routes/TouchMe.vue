<template>
  <div className="mainContainer">
    <HeadBar :headItems="headItems"></HeadBar>
    <div className="container">
      <!-- Дополнительный элемент перед всеми -->
      <a :id="'link_0'" :href="'#link_1'">
        <CircleLinker className="circle"></CircleLinker>
      </a>
      <!-- Существующие элементы с увеличенными индексами -->
      <template v-for="(link, index) in links" :key="link.id">
        <Link v-bind:logoImg="link.img" :logoRef="link.ref" v-bind:logo-text="link.text"></Link>
        <a :id="'link_' + (index + 1)" :href="'#link_' + nextLinkIndex(index + 1)">
          <CircleLinker className="circle"></CircleLinker>
        </a>
      </template>
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
    nextLinkIndex(i) {
      if (i === this.links.length) {
        return 0
      }
      return i + 1
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
  scroll-behavior: smooth; /* Добавлено для медленной прокрутки */
}

.container {
  display: flex;
  white-space: nowrap;
  overflow-x: auto;
  flex-direction: column;
  align-content: center;
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