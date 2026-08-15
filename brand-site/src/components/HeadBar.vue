<template>
  <div
    class="headBar"
    autofocus
    @keydown.left="handleLeftArrow"
    @keydown.right="handleRightArrow"
  >
    <div class="headLogo">
      <TextRef :item="mainLogoItem" />
    </div>
    <SwitchBar class="navBar" :items="headItems" />
    <LocaleSwitcher />
  </div>
</template>

<script>
import TextRef from "@/components/TextRef.vue";
import SwitchBar from "@/components/SwitchBar.vue";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

export default {
  props: {
    headItems: {
      type: Array,
      required: true
    }
  },
  components: {SwitchBar, TextRef, LocaleSwitcher},
  computed: {
    mainLogoItem() {
      return {
        text: this.$t("brand.name"),
        ref: '/?page=main',
        isMainSwitch: true
      };
    },
  },
  data() {
    return {}
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
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px 20px;
  padding: 50px;
  background-color: white;
}

.headLogo {
  min-width: 0;
}

.navBar {
  min-width: 0;
  justify-self: end;
}

@media (max-width: 768px) {
  .headBar {
    padding: 16px;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
  }

  .headLogo {
    grid-column: 1;
    grid-row: 1;
  }

  .headBar > :last-child {
    grid-column: 2;
    grid-row: 1;
    align-self: center;
  }

  .navBar {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-self: stretch;
  }
}

@media (prefers-color-scheme: dark) {
  .headBar {
    background-color: #2d2d2d;
  }
}
</style>