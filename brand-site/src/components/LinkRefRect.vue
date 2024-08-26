<template>
  <div className="rect"></div>
</template>

<script>

</script>

<style scoped>
.rect {
  width: 100px;
  height: 6px;
  background-color: white;
  border-radius: 100px;
}

@media (max-width: 768px) {
  .rect {
    width: 50px;
    height: 3px;
  }
}
</style>