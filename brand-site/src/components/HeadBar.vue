<template>
  <div
    class="headBar"
    autofocus
    @keydown.left="handleLeftArrow"
    @keydown.right="handleRightArrow"
  >
    <div class="headLogo">
      <TextRef :item="mainLogoItem" />
    </div>
    <SwitchBar class="navBar" :items="headItems" />
    <div class="langSwitcher" aria-label="Language switcher">
      <button class="langBtn" :class="{ active: currentLocale === 'en' }" type="button" @click="setLocale('en')">
        {{ $t('languageSwitcher.en') }}
      </button>
      <span class="langSeparator">/</span>
      <button class="langBtn" :class="{ active: currentLocale === 'ru' }" type="button" @click="setLocale('ru')">
        {{ $t('languageSwitcher.ru') }}
      </button>
    </div>
  </div>
</template>

<script>
import TextRef from "@/components/TextRef.vue";
import SwitchBar from "@/components/SwitchBar.vue";
import { applyLocaleToDocument, setStoredLocale } from "@/i18n";

export default {
  props: {
    headItems: {
      type: Array,
      required: true
    }
  },
  components: {SwitchBar, TextRef},
  computed: {
    currentLocale() {
      return this.$i18n.locale;
    },
    mainLogoItem() {
      return {
        text: this.$t("brand.name"),
        ref: '/?page=main',
        isMainSwitch: true
      };
    },
  },
  data() {
    return {}
  },
  methods: {
    setLocale(locale) {
      if (!["en", "ru"].includes(locale)) return;
      this.$i18n.locale = locale;
      setStoredLocale(locale);
      applyLocaleToDocument(locale);
    },
    handleLeftArrow() {
      const index = this.headItems.findIndex(item => item.isMainSwitch);
      if (index > 0) {
        this.headItems[index].isMainSwitch = false;
        this.headItems[index - 1].isMainSwitch = true;
        this.$router.push(this.headItems[index - 1].ref);
      }
    },
    handleRightArrow() {
      const index = this.headItems.findIndex(item => item.isMainSwitch);
      if (index < this.headItems.length - 1) {
        this.headItems[index].isMainSwitch = false;
        this.headItems[index + 1].isMainSwitch = true;
        this.$router.push(this.headItems[index + 1].ref);
      }
    }
  }
}
</script>

<style scoped>
.headBar {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px 20px;
  padding: 50px;
  background-color: white;
}

.headLogo {
  min-width: 0;
}

.navBar {
  min-width: 0;
  justify-self: end;
}

.langSwitcher {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 100px;
  border: 2px solid #4f3dff;
  background-color: #ffffff;
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
  .headBar {
    padding: 16px;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
  }

  .headLogo {
    grid-column: 1;
    grid-row: 1;
  }

  .langSwitcher {
    grid-column: 2;
    grid-row: 1;
    align-self: center;
    padding: 5px 8px;
  }

  .navBar {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-self: stretch;
  }

  .langBtn,
  .langSeparator {
    font-size: 14px;
  }
}

@media (prefers-color-scheme: dark) {
  .headBar {
    background-color: #2d2d2d;
  }

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