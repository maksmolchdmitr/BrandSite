<template>
  <div @keydown.left="handleLeftArrow" @keydown.right="handleRightArrow" className="headBar" autofocus>
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
  },
  methods: {
    handleLeftArrow() {
      const index = this.headItems.findIndex(item => item.isMainSwitch);
      if (index > 0) {
        this.headItems[index].isMainSwitch = false;
        this.headItems[index - 1].isMainSwitch = true;
        this.$router.push(this.headItems[index - 1].ref);
      }
    },
    handleRightArrow() {
      const index = this.headItems.findIndex(item => item.isMainSwitch);
      if (index < this.headItems.length - 1) {
        this.headItems[index].isMainSwitch = false;
        this.headItems[index + 1].isMainSwitch = true;
        this.$router.push(this.headItems[index + 1].ref);
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

@media (max-width: 768px) {
  .headBar {
    padding: 20px;
  }

  .switchItem {
    font-size: 16px;
  }
}
</style>