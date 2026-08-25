<template>
  <div class="notifBody">
    <PersonChip
      size="sm"
      :name="senderName"
      :photo-url="item.senderPhotoUrl || ''"
      :username="item.senderUsername || ''"
    />
    <div class="notifMeta">{{ subtitle }}</div>
    <div v-if="isRoleChanged" class="roleChangedDetail">{{ roleChangedDetail }}</div>
    <div v-if="isLinkUserInvite" class="unlinkedBlock">
      <div class="unlinkedLabel">{{ $t("badminton.notifications.unlinkedParticipant") }}</div>
      <PersonChip
        size="sm"
        :name="unlinkedName"
        :photo-url="item.unlinkedPhotoUrl || ''"
      />
      <router-link class="gamesLink" :to="gamesLink">
        {{ $t("badminton.notifications.viewUnlinkedGames") }}
      </router-link>
    </div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import PersonChip from "@/components/badminton/PersonChip.vue";
import {
  linkUserMatchesTo,
  notificationSenderName,
  notificationUnlinkedName,
} from "@/badminton/notificationInbox.js";

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
    unlinkedName() {
      return notificationUnlinkedName(this.item);
    },
    subtitle() {
      const group = this.item.groupName || this.item.groupId || "";
      return group ? `${group} · ${this.kindLabel}` : this.kindLabel;
    },
    isLinkUserInvite() {
      return this.item.kind === "link_user_invite" && this.item.invitationStatus === "pending";
    },
    isRoleChanged() {
      return this.item.kind === "role_changed" && Boolean(this.item.role);
    },
    roleChangedDetail() {
      const role = String(this.item.role || "").toLowerCase();
      const roleLabel = this.$t(`badminton.notifications.roleLabels.${role}`);
      const capabilities = this.$t(`badminton.notifications.roleCapabilities.${role}`);
      const username = String(this.item.senderUsername || "").trim();
      const sender = username ? `${this.senderName} @${username}` : this.senderName;
      return this.$t("badminton.notifications.roleChangedDetail", {
        sender,
        role: roleLabel,
        capabilities,
      });
    },
    gamesLink() {
      return linkUserMatchesTo(this.item.id, this.item.groupId);
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

.roleChangedDetail {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  padding-left: 2px;
  line-height: 1.35;
}

.unlinkedBlock {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(79, 61, 255, 0.15);
}

.unlinkedLabel {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  opacity: 0.65;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.gamesLink {
  align-self: flex-start;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: #4f3dff;
  text-decoration: none;
}

.gamesLink:hover {
  text-decoration: underline;
}

@media (prefers-color-scheme: dark) {
  .notifMeta,
  .unlinkedLabel {
    color: #b0b0b0;
    opacity: 1;
  }

  .roleChangedDetail {
    color: #e8e8e8;
  }

  .unlinkedBlock {
    border-top-color: rgba(184, 168, 255, 0.2);
  }

  .gamesLink {
    color: #b8a8ff;
  }
}
</style>
