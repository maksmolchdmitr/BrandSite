<template>
  <img className="circle" alt="-" src="@/assets/CircleLinker.svg"/>
</template>

<script>
export default {
  name: "CircleLinker"
}
</script>

<style scoped>
.circle {
  background-color: white;
  border-radius: 100px;
  height: 100px;
}

@media (max-width: 768px) {
  .circle {
    height: 50px;
  }
}
</style>