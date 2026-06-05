<template>
  <div class="bar">
    <div class="barItem" v-for="(el, i) in items" :key="i">
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
  max-width: 100%;
  box-sizing: border-box;
  align-items: center;
  padding: 36px 50px;
}

.barItem {
  width: 100%;
  max-width: 640px;
  min-width: 0;
}

@media (max-width: 768px) {
  .bar {
    gap: 12px;
    align-items: stretch;
    padding: 12px 16px;
  }

  .barItem {
    max-width: 100%;
  }
}
</style>
