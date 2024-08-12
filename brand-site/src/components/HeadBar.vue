<template>
  <div className="headBar">
    <TextRef :item="mainLogoItem"></TextRef>
    <SwitchBar className="switchBar" :items="headItems"></SwitchBar>
  </div>
</template>

<script>
import TextRef from "@/components/TextRef.vue";
import SwitchBar from "@/components/SwitchBar.vue";

export default {
  props: {
    headItems: {
      type: Object,
      required: true
    }
  },
  components: {SwitchBar, TextRef},
  data() {
    return {
      mainLogoItem: {
        text: 'MaksMolch',
        ref: '/',
        isMainSwitch: true
      }
    }
  }
}
</script>

<style scoped>
.headBar {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  padding: 50px;
  background-color: white;
}
</style>