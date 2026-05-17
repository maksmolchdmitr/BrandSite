<template>
  <nav class="pillNav" :aria-label="ariaLabel">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      class="pillNavLink"
      :class="{ active: item.active }"
      :to="item.to"
    >
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "BadmintonPillNav",
  props: {
    items: {
      type: Array,
      required: true,
      // { to: string, label: string, active?: boolean }
    },
    ariaLabel: { type: String, default: "" },
  },
});
</script>

<style scoped>
.pillNav {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.pillNavLink {
  padding: 10px 18px;
  border-radius: 100px;
  text-decoration: none;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 16px;
  color: #4f3dff;
  border: 2px solid #e0e0ff;
  background: white;
  transition: background 0.2s, border-color 0.2s;
}
.pillNavLink:hover {
  background: #fafaff;
  border-color: #4f3dff;
}
.pillNavLink.active {
  background: #4f3dff;
  color: white;
  border-color: #4f3dff;
}
@media (prefers-color-scheme: dark) {
  .pillNavLink {
    background: #2d2d2d;
    border-color: #4a4a4a;
    color: #c7bcff;
  }
  .pillNavLink:hover {
    background: #363636;
  }
  .pillNavLink.active {
    background: #4f3dff;
    color: white;
    border-color: #4f3dff;
  }
}
</style>
