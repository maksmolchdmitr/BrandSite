<template>
  <HeadBar :headItems="headItems"></HeadBar>
  <div className="container">
    <template v-for="(link, index) in links" :key="link.id">
      <Link v-bind:logoImg="link.img" v-bind:logo-text="link.text"></Link>
      <CircleLinker className="circle" v-if="index < links.length - 1"></CircleLinker>
    </template>
  </div>
</template>

<script>
import HeadBar from "@/components/HeadBar.vue";
import LinkRefRect from "@/components/LinkRefRect.vue";
import CircleLinker from "@/components/CircleLinker.vue";
import Link from "@/components/Link.vue";
import tgImgSource from "@/assets/logo/Telegram.svg";

export default {
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
          text: "Telegram"
        },
        {
          img: "LinkedIn.svg",
          text: "LinkedIn"
        },
        {
          img: "Figma.svg",
          text: "Figma"
        },
        {
          img: "VK.svg",
          text: "VK"
        },
        {
          img: "Gmail.svg",
          text: "Gmail"
        },
      ]
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  white-space: nowrap;
  overflow-x: auto;
}

.circle{
  width: 100px;
}
</style>