<template>
<!--  <link href='https://fonts.googleapis.com/css?family=Mali' rel='stylesheet'>-->
  <RouterLink v-if="item.isMainSwitch" className="mainSwitch switchItem" v-bind:to="item.ref">{{ item.text }}</RouterLink>
  <RouterLink v-else className="switchItem" v-bind:to="item.ref">{{ item.text }}</RouterLink>
</template>

<script>
export default {
  props: {
    item: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Mali&display=swap');

.switchItem {
  font-family: 'Mali', 'sans-serif';
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
</style>