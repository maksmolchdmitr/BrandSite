<template>
  <RouterLink v-if="item.isMainSwitch" class="mainSwitch switchItem" v-bind:to="item.ref">{{ item.text }}</RouterLink>
  <RouterLink v-else class="switchItem" v-bind:to="item.ref">{{ item.text }}</RouterLink>
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
  white-space: nowrap;
}

a {
  text-decoration: none;
}

.mainSwitch {
  font-weight: bold;
  color: #4F3DFF;
}

@media (max-width: 768px) {
  .switchItem {
    font-size: 15px;
  }

  .mainSwitch {
    font-size: 17px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    vertical-align: bottom;
  }
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