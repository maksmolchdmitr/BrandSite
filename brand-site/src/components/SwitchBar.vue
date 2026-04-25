<template>
  <div class="switchBar">
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
  flex-wrap: wrap;
  gap: 36px;
  justify-content: flex-end;
  align-items: center;
  min-width: 0;
}

@media (min-width: 769px) {
  .switchBar {
    flex-wrap: nowrap;
  }
}

@media (max-width: 768px) {
  .switchBar {
    gap: 10px 14px;
    justify-content: center;
    width: 100%;
  }
}
</style>