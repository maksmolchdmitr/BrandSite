<template>
  <HeadBar :headItems="headItems"></HeadBar>
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

</style>