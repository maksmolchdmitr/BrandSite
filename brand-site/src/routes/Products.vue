<template>
  <HeadBar :headItems="headItems"></HeadBar>
<!--  <div class="random-walk-link">-->
<!--    <a href="https://github.com/ru-random-walk/mobile_app/releases/download/v0.0.7-beta/app-release.apk" target="_blank">-->
<!--      <img src="@/assets/RandomWalk.svg" alt="Random Walk"/>-->
<!--      <span>Random Walk Android App</span>-->
<!--    </a>-->
<!--  </div>-->
</template>

<script>

import {defineComponent} from "vue";
import HeadBar from "@/components/HeadBar.vue";

export default defineComponent({
  components: {HeadBar},
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
          isMainSwitch: false
        },
        {
          text: 'Products',
          ref: '/products',
          isMainSwitch: true
        }
      ]
    }
  }
})
</script>

<style scoped>
.random-walk-link {
  margin-top: 20px;
  text-align: center;
}

.random-walk-link a {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.random-walk-link img {
  width: 50%; /* Adjust size as needed */
  height: 50%; /* Adjust size as needed */
}
</style>