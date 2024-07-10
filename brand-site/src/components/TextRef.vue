<template>
<!--  <link href='https://fonts.googleapis.com/css?family=Mali' rel='stylesheet'>-->
  <a v-if="item.isMainSwitch" className="mainSwitch switchItem" href="{{ item.ref }}">{{ item.text }}</a>
  <a v-else className="switchItem" href="{{ item.ref }}">{{ item.text }}</a>
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