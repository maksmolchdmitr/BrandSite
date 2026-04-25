<template>
  <main>
    <RouterView/>
  </main>
</template>

<script>
</script>

<style>
@media (prefers-reduced-motion: no-preference) {
  :root {
    scroll-behavior: smooth;
  }
}

body {
  margin: 0;
  background-color: #d9d9d9;
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }

  body {
    background-color: #1a1a1a;
    color: #e8e8e8;
  }
}
</style>