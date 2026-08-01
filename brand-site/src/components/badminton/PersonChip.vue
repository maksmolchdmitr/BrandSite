<template>
  <span class="personChip">
    <img
      v-if="photoUrl"
      class="avatar"
      :src="photoUrl"
      :alt="name"
      loading="lazy"
      referrerpolicy="no-referrer"
    />
    <span v-else class="avatar avatarFallback" aria-hidden="true">{{ initials }}</span>
    <span class="personText">
      <span class="personName">{{ name }}</span>
      <span v-if="username" class="personUsername">@{{ username }}</span>
    </span>
  </span>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "PersonChip",
  props: {
    name: { type: String, default: "—" },
    photoUrl: { type: String, default: "" },
    username: { type: String, default: "" },
  },
  computed: {
    initials() {
      const parts = String(this.name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (parts.length === 0) return "?";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },
  },
});
</script>

<style scoped>
.personChip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex: 0 0 auto;
  background: #e8e8f8;
}
.avatarFallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #4F3DFF;
  letter-spacing: -0.02em;
}
.personText {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  flex-wrap: wrap;
}
.personName {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.personUsername {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.65;
  white-space: nowrap;
}
</style>
