<template>
  <div :id="'date_' + this.data.dateNumber" className="experienceItem">
    <DateSwitch :dateData="getDateData()"></DateSwitch>
    <div className="experienceText" v-html="data.experienceText"></div>
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
@import url('https://fonts.googleapis.com/css2?family=Mali&display=swap');

.experienceItem {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background-color: white;
  border-radius: 32px;
  width: 600px;
}

.experienceText {
  font-family: 'Mali', 'sans-serif';
  font-size: 24px;
  color: black;
  white-space: pre-line;
}

@media (max-width: 768px) {
  .experienceText {
    font-size: 16px;
  }

  .experienceItem {
    width: auto;
  }
}
</style>
