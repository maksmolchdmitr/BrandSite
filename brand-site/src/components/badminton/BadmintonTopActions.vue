<template>
  <div class="topActions">
    <BadmintonNotificationBell />
    <LocaleSwitcher />
  </div>
</template>

<script>
import {defineComponent} from "vue";
import BadmintonNotificationBell from "@/components/badminton/BadmintonNotificationBell.vue";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

export default defineComponent({
  name: "BadmintonTopActions",
  components: {BadmintonNotificationBell, LocaleSwitcher},
});
</script>

<style scoped>
.topActions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
</style>
