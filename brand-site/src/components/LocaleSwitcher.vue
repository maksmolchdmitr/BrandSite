<template>
  <div class="langSwitcher" aria-label="Language switcher">
    <button class="langBtn" :class="{ active: currentLocale === 'en' }" type="button" @click="setLocale('en')">
      {{ $t('languageSwitcher.en') }}
    </button>
    <span class="langSeparator">/</span>
    <button class="langBtn" :class="{ active: currentLocale === 'ru' }" type="button" @click="setLocale('ru')">
      {{ $t('languageSwitcher.ru') }}
    </button>
  </div>
</template>

<script>
import { applyLocaleToDocument, setStoredLocale } from "@/i18n";

export default {
  name: "LocaleSwitcher",
  computed: {
    currentLocale() {
      return this.$i18n.locale;
    },
  },
  methods: {
    setLocale(locale) {
      if (!["en", "ru"].includes(locale)) return;
      this.$i18n.locale = locale;
      setStoredLocale(locale);
      applyLocaleToDocument(locale);
    },
  },
};
</script>

<style scoped>
.langSwitcher {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 100px;
  border: 2px solid #4f3dff;
  background-color: #ffffff;
  flex-shrink: 0;
}

.langBtn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #222;
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 1;
  padding: 0;
  text-transform: lowercase;
}

.langBtn.active {
  color: #4f3dff;
  font-weight: 700;
}

.langSeparator {
  color: #7a7a7a;
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 1;
}

@media (max-width: 768px) {
  .langSwitcher {
    padding: 5px 8px;
  }

  .langBtn,
  .langSeparator {
    font-size: 14px;
  }
}

@media (prefers-color-scheme: dark) {
  .langSwitcher {
    background-color: #2d2d2d;
    border-color: #b8a8ff;
  }

  .langBtn {
    color: #d8d8d8;
  }

  .langBtn.active {
    color: #b8a8ff;
  }

  .langSeparator {
    color: #ababab;
  }
}
</style>
