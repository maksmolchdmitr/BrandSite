<template>
  <span class="personChip" :class="size === 'sm' ? 'personChipSm' : null">
    <span v-if="photoUrl" class="avatar">
      <PhotoHoldPreview
        :src="photoUrl"
        :photo-crop="photoCrop"
        :alt="name"
        loading="lazy"
      />
    </span>
    <span v-else class="avatar avatarFallback" aria-hidden="true">{{ initials }}</span>
    <span class="personText">
      <span class="personName">{{ name }}</span>
      <span v-if="username" class="personUsername">@{{ username }}</span>
    </span>
  </span>
</template>

<script>
import { defineComponent } from "vue";
import PhotoHoldPreview from "@/components/badminton/PhotoHoldPreview.vue";

export default defineComponent({
  name: "PersonChip",
  components: { PhotoHoldPreview },
  props: {
    name: { type: String, default: "—" },
    photoUrl: { type: String, default: "" },
    photoCrop: { type: Object, default: null },
    username: { type: String, default: "" },
    size: {
      type: String,
      default: "md",
      validator: (value) => value === "md" || value === "sm",
    },
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
  gap: 12px;
  min-width: 0;
  max-width: 100%;
}

.personChipSm {
  gap: 10px;
}

.personChipSm .avatar,
.personChipSm .avatarFallback {
  width: 40px;
  height: 40px;
}

.personChipSm .avatarFallback {
  font-size: 14px;
}

.personChipSm .personName {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
}
.avatar,
.avatarFallback {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  flex: 0 0 auto;
  background: #e8e8f8;
  overflow: hidden;
  position: relative;
  display: inline-block;
}
:deep(.avatar .photoCropFrame) {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
:deep(.avatar img:not(.cropped)) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.avatarFallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
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
