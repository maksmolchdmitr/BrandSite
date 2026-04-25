<template>
  <RouterLink v-if="item.isMainSwitch" className="mainSwitch switchItem" v-bind:to="item.ref">{{ item.text }}</RouterLink>
  <RouterLink v-else className="switchItem" v-bind:to="item.ref">{{ item.text }}</RouterLink>
</template>

<script>
export default {
  props: {
    item: {
      type: {
        isMainSwitch: Boolean,
        text: String,
        ref: String
      },
      required: true
    }
  }
}
</script>

<style scoped>
.switchItem {
  font-family: var(--font-display);
  font-size: 36px;
  color: black;
}

a {
  text-decoration: none;
}

.mainSwitch {
  font-weight: bold;
  color: #4F3DFF;
}

@media (prefers-color-scheme: dark) {
  .switchItem {
    color: #e8e8e8;
  }

  .mainSwitch {
    color: #b8a8ff;
  }
}
</style>