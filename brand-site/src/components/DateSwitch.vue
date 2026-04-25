<template>
  <div className="dateSwitcher">
    <div v-for="i in Array(dateData.count).fill().map((_, idx) => idx)" :key="i">
      <div className="dateBlock" v-if="i === dateData.number">
        <a className="dateText">{{ dateData.text }}</a>
      </div>
      <div v-else>
        <a :href="'#date_' + i">
          <img className="circleSwitcher" :src="iconSrc" alt="Another date link">
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
@import url('https://fonts.googleapis.com/css2?family=Mali&display=swap');

.dateSwitcher {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 16px;
}

.dateText {
  font-family: 'Mali', 'sans-serif';
  font-size: 24px;
  color: black;
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
}

.circleSwitcher {
  transition: opacity 0.3s ease;
}

@media (max-width: 768px) {
  .dateSwitcher {
    gap: 8px;
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