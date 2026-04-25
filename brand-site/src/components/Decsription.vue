<template>
  <p>{{ $t('main.intro', { name: $t('main.name') }) }} <br> {{ $t('main.introLine2') }}</p>
</template>

<script>
</script>

<style scoped>
p {
  font-family: var(--font-display);
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