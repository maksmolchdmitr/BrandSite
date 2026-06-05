<template>
  <div :id="'date_' + this.data.dateNumber" class="experienceItem">
    <DateSwitch :dateData="getDateData()"></DateSwitch>
    <div class="experienceText" v-html="data.experienceText"></div>
  </div>
</template>

<script>
import DateSwitch from "@/components/DateSwitch.vue";

export default {
  components: {
    DateSwitch
  },
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  methods: {
    getDateData() {
      return {
        number: this.data.dateNumber,
        text: this.data.dateText,
        count: this.data.dateCount
      }
    }
  }
}
</script>

<style scoped>
.experienceItem {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background-color: white;
  border-radius: 32px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.experienceText {
  font-family: var(--font-display);
  font-size: 24px;
  color: black;
  white-space: pre-line;
  overflow-wrap: anywhere;
  word-break: break-word;
}

@media (max-width: 768px) {
  .experienceText {
    font-size: 16px;
  }

  .experienceItem {
    padding: 16px;
    border-radius: 20px;
    gap: 12px;
  }
}

@media (prefers-color-scheme: dark) {
  .experienceItem {
    background-color: #2d2d2d;
  }

  .experienceText {
    color: #e8e8e8;
  }

  .experienceText :deep(a) {
    color: #b8a8ff;
  }
}
</style>
