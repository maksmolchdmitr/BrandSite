<template>
  <div class="notifBody">
    <PersonChip
      size="sm"
      :name="senderName"
      :photo-url="item.senderPhotoUrl || ''"
    />
    <div class="notifMeta">{{ subtitle }}</div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import PersonChip from "@/components/badminton/PersonChip.vue";
import {notificationSenderName} from "@/badminton/notificationInbox.js";

export default defineComponent({
  name: "BadmintonNotificationItemBody",
  components: {PersonChip},
  props: {
    item: { type: Object, required: true },
    kindLabel: { type: String, required: true },
  },
  computed: {
    senderName() {
      return notificationSenderName(this.item);
    },
    subtitle() {
      const group = this.item.groupName || this.item.groupId || "";
      return group ? `${group} · ${this.kindLabel}` : this.kindLabel;
    },
  },
});
</script>

<style scoped>
.notifBody {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.notifMeta {
  font-family: var(--font-display);
  opacity: 0.7;
  font-size: 13px;
  padding-left: 2px;
}

@media (prefers-color-scheme: dark) {
  .notifMeta {
    color: #b0b0b0;
    opacity: 1;
  }
}
</style>
