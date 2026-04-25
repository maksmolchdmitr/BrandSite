<template>
  <main>
    <RouterView/>
  </main>
</template>

<script>
import { applyLocaleToDocument } from "@/i18n";

export default {
  computed: {
    currentLocale() {
      return this.$i18n.locale || "en";
    },
  },
  watch: {
    currentLocale: {
      immediate: true,
      handler(locale) {
        applyLocaleToDocument(locale);
      },
    },
  },
  mounted() {
    applyLocaleToDocument(this.currentLocale);
  },
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Mali:wght@400;700&family=Neucha&display=swap');

@media (prefers-reduced-motion: no-preference) {
  :root {
    scroll-behavior: smooth;
  }
}

:root {
  --font-latin: "Mali", sans-serif;
  --font-cyrillic: "Neucha", sans-serif;
  --font-display: var(--font-latin);
}

:root[data-locale="ru"] {
  --font-display: var(--font-cyrillic);
}

html {
  overflow-x: hidden;
  max-width: 100%;
}

body {
  margin: 0;
  background-color: #d9d9d9;
  overflow-x: hidden;
  max-width: 100%;
}

main {
  max-width: 100%;
  overflow-x: hidden;
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