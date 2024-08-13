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
import figmaImgSource from "@/assets/logo/Figma.svg";
import vkImgSource from "@/assets/logo/VK.svg";
import gmailImgSource from "@/assets/logo/Gmail.svg";
import linkedInImgSource from "@/assets/logo/LinkedIn.svg";

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
          img: linkedInImgSource,
          text: "LinkedIn"
        },
        {
          img: figmaImgSource,
          text: "Figma"
        },
        {
          img: vkImgSource,
          text: "VK"
        },
        {
          img: gmailImgSource,
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