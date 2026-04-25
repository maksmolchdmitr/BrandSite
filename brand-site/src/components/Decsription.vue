<template>
  <p>Hi, I'm <a className="refText">Maks</a> <br> I work as Backend Software Engineer and have studied at HSE</p>
</template>

<script>
</script>

<style scoped>
p {
  font-family: 'Mali', 'sans-serif';
  font-size: 36px;
  color: black;
  text-align: center;
  margin: 0;
}

.refText {
  font-weight: bold;
  color: #4F3DFF;
}

@media (prefers-color-scheme: dark) {
  p {
    color: #e8e8e8;
  }

  .refText {
    color: #b8a8ff;
  }
}
</style>