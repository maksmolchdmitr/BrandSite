<template>
  <div className="switchBar">
    <div v-for="(item, i) in items" :key="i">
      <TextRef :item="item"></TextRef>
    </div>
  </div>
</template>

<script>
import TextRef from "@/components/TextRef.vue";

export default {
  components: {
    TextRef
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
.switchBar {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 36px;
}

@media (max-width: 768px) {
  .switchItem {
    font-size: 16px;
  }

  .switchBar {
    gap: 12px;
  }
}
</style>