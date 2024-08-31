<template>
  <a :href="logoRef" target="_blank">
    <div className="linkContent">
      <img className="logoImage" :src="logoImg" v-bind:alt="logoText">
      <LinkRefRect></LinkRefRect>
      <a className="logoText">{{ logoText }}</a>
    </div>
  </a>
</template>

<script>

import {defineComponent} from "vue";
import LinkRefRect from "@/components/LinkRefRect.vue";

export default defineComponent({
  components: {LinkRefRect},
  props: {
    logoImg: {
      type: String,
      required: true
    },
    logoText: {
      type: String,
      required: true
    },
    logoRef: String
  }
})
</script>

<style scoped>
.linkContent {
  background-color: #4F3DFF;
  border-radius: 100px;
  flex-direction: row;
  gap: 10px;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
}

.logoText {
  font-size: 36px;
  color: white;
  font-family: Mali, serif;
}

.logoImage {
  width: 60px;
  height: 60px;
}

@media (max-width: 768px) {
  .linkContent {
    gap: 5px;
    padding: 10px;
    height: 30px;
  }

  .logoText {
    font-size: 18px;
  }

  .logoImage {
    width: 30px;
    height: 30px;
  }
}
</style>