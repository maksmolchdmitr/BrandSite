<template>
  <div className="bar">
    <div v-for="(el, i) in items" :key="i">
      <ExperienceItem :data="{dateText: el.date, dateNumber: items.length - i - 1, dateCount: items.length, experienceText: el.text}"></ExperienceItem>
    </div>
  </div>
</template>

<script>

import ExperienceItem from "@/components/ExperienceItem.vue";

export default {
  components: {
    ExperienceItem
  },
  props: {
    items: {
      type: Array,
      required: true
    }
  }
}
</script>

<style scoped>
.bar {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 36px;
  width: 100%;
  justify-content: center;
  align-items: center;
}

@media (max-width: 768px) {
  .bar {
    gap: 12px;
    width: auto;
    justify-content: center;
    align-items: center;
  }
}
</style>