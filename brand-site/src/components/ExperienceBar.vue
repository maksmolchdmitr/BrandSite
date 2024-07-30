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
  padding: 36px;
  gap: 36px;
}

@media (max-width: 768px) {
  .bar {
    padding: 12px;
    gap: 12px;
  }
}
</style>