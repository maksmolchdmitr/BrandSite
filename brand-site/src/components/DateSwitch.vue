<template>
  <div class="dateSwitcher">
    <div v-for="i in Array(dateData.count).fill().map((_, idx) => idx)" :key="i">
      <div class="dateBlock" v-if="i === dateData.number">
        <span class="dateText">{{ dateData.text }}</span>
      </div>
      <div v-else>
        <a :href="'#date_' + i">
          <img class="circleSwitcher" :src="iconSrc" :alt="$t('dateSwitch.alt')">
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import DateFromButtonDefault from '@/assets/DateFromButton.svg'
import DateFromButtonWhite from '@/assets/DateFromButton-white.svg'

export default {
  props: {
    dateData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isDarkMode: false
    }
  },
  computed: {
    iconSrc() {
      return this.isDarkMode ? DateFromButtonWhite : DateFromButtonDefault
    }
  },
  mounted() {
    this.mql = window.matchMedia('(prefers-color-scheme: dark)')
    this.isDarkMode = this.mql.matches
    this._onColorScheme = (e) => {
      this.isDarkMode = e.matches
    }
    if (this.mql.addEventListener) {
      this.mql.addEventListener('change', this._onColorScheme)
    } else {
      this.mql.addListener(this._onColorScheme)
    }
  },
  beforeUnmount() {
    if (!this.mql || !this._onColorScheme) return
    if (this.mql.removeEventListener) {
      this.mql.removeEventListener('change', this._onColorScheme)
    } else {
      this.mql.removeListener(this._onColorScheme)
    }
  }
}
</script>

<style scoped>
.dateSwitcher {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 16px;
  max-width: 100%;
  min-width: 0;
}

.dateText {
  font-family: var(--font-display);
  text-align: center;
  line-height: 32px; /* равен высоте контейнера */
  display: block;
}

:global(:root[data-locale="ru"]) .dateText {
  transform: translateY(2px);
}

.dateBlock {
  height: 32px;
  width: fit-content;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 100px;
  background-color: #D9D9D9;
  display: flex;
  justify-content: center;
  align-items: center;
}

.circleSwitcher {
  transition: opacity 0.3s ease;
}

@media (max-width: 768px) {
  .dateSwitcher {
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .dateText {
    font-size: 16px;
  }

  .dateBlock {
    height: 24px;
  }

  .circleSwitcher {
    height: 24px;
    width: 24px;
  }
}

@media (prefers-color-scheme: dark) {
  .dateText {
    color: #e8e8e8;
  }

  .dateBlock {
    background-color: #404040;
  }
}

</style>