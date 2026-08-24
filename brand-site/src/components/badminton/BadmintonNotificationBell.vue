<template>
  <div ref="root" class="bellRoot">
    <button
      class="bellBtn"
      type="button"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-label="$t('badminton.notifications.title')"
      @click="toggle"
    >
      <svg class="bellIcon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22Zm7.2-5.5V11a7.2 7.2 0 0 0-5.4-7V3.2a1.8 1.8 0 1 0-3.6 0V4a7.2 7.2 0 0 0-5.4 7v5.5L3 18.3v1.1h18v-1.1l-1.8-1.8Z"
        />
      </svg>
      <span v-if="unreadCount > 0" class="badge">{{ unreadLabel }}</span>
    </button>

    <div v-if="open" class="panel" role="dialog" :aria-label="$t('badminton.notifications.title')">
      <div class="panelHead">
        <div class="panelTitle">{{ $t('badminton.notifications.title') }}</div>
        <button class="linkBtn" type="button" :disabled="loading" @click="refresh">
          {{ $t('common.actions.refresh') }}
        </button>
      </div>

      <div v-if="error" class="panelError">{{ error }}</div>
      <div v-else-if="loading && items.length === 0" class="panelEmpty">
        {{ $t('common.actions.loading') }}
      </div>
      <div v-else-if="items.length === 0" class="panelEmpty">
        {{ $t('badminton.notifications.empty') }}
      </div>
      <div v-else class="panelList">
        <div
          v-for="item in items"
          :key="item.id"
          class="notifItem"
          :class="{ unread: item.unread !== false }"
        >
          <div class="notifBody">
            <div class="notifTitle">{{ item.groupName || item.groupId }}</div>
            <div class="notifMeta">{{ formatKind(item.kind) }}</div>
          </div>
          <div class="notifActions">
            <button
              v-if="item.unread !== false"
              class="actionBtn secondary"
              type="button"
              :disabled="busyId === item.id"
              @click="markRead(item)"
            >
              {{ $t('badminton.notifications.markRead') }}
            </button>
            <template v-if="canResolve(item)">
              <button
                class="actionBtn"
                type="button"
                :disabled="busyId === item.id"
                @click="accept(item)"
              >
                {{ $t('badminton.notifications.accept') }}
              </button>
              <button
                class="actionBtn secondary"
                type="button"
                :disabled="busyId === item.id"
                @click="reject(item)"
              >
                {{ $t('badminton.notifications.reject') }}
              </button>
            </template>
          </div>
        </div>
      </div>
      <button
        v-if="pageToken"
        class="linkBtn footerBtn"
        type="button"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ $t('badminton.notifications.loadMore') }}
      </button>
      <button
        v-else-if="!loading"
        class="linkBtn footerBtn"
        type="button"
        :disabled="loading"
        @click="switchFilter"
      >
        {{ unreadFilter
          ? $t('badminton.notifications.viewRead')
          : $t('badminton.notifications.viewUnread') }}
      </button>
    </div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import {badmintonClient} from "@/badminton/client.js";
import {
  publishUnreadCount,
  subscribeUnreadCount,
  unreadCountFromPage,
} from "@/badminton/notificationInbox.js";

const PAGE_SIZE = 10;
const NOTIFICATION_POLL_MS = 60_000;

export default defineComponent({
  name: "BadmintonNotificationBell",
  data() {
    return {
      open: false,
      loading: false,
      loadingMore: false,
      error: "",
      items: [],
      pageToken: null,
      unreadFilter: true,
      busyId: null,
      loadedOnce: false,
      pollTimer: null,
      badgeUnreadCount: 0,
      unsubscribeUnreadCount: null,
    };
  },
  computed: {
    isNotificationsPage() {
      const query = this.$route?.query || {};
      const section = query.section;
      return query.page === "badminton"
        && (section === "notifications" || section === "invitations");
    },
    unreadCount() {
      return this.badgeUnreadCount;
    },
    unreadLabel() {
      return this.unreadCount > 9 ? "9+" : String(this.unreadCount);
    },
  },
  mounted() {
    this.unsubscribeUnreadCount = subscribeUnreadCount((count) => {
      this.badgeUnreadCount = count;
    });
    if (!this.isNotificationsPage) {
      this.refresh();
      this.pollTimer = setInterval(() => this.poll(), NOTIFICATION_POLL_MS);
    }
    document.addEventListener("pointerdown", this.onDocPointer, true);
    document.addEventListener("keydown", this.onDocKey);
  },
  beforeUnmount() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.unsubscribeUnreadCount) this.unsubscribeUnreadCount();
    document.removeEventListener("pointerdown", this.onDocPointer, true);
    document.removeEventListener("keydown", this.onDocKey);
  },
  watch: {
    isNotificationsPage(onNotificationsPage, wasOnNotificationsPage) {
      if (onNotificationsPage) {
        if (this.pollTimer) {
          clearInterval(this.pollTimer);
          this.pollTimer = null;
        }
        return;
      }
      if (wasOnNotificationsPage) {
        this.refresh();
        if (!this.pollTimer) {
          this.pollTimer = setInterval(() => this.poll(), NOTIFICATION_POLL_MS);
        }
      }
    },
  },
  methods: {
    formatKind(kind) {
      const key = `badminton.notifications.kinds.${kind}`;
      const translated = this.$t(key);
      return translated === key ? kind : translated;
    },
    canResolve(item) {
      return (item.kind === "group_join_invite" || item.kind === "link_user_invite")
        && item.invitationStatus === "pending"
        && Boolean(item.invitationId);
    },
    async toggle() {
      this.open = !this.open;
      if (this.open) await this.refresh();
    },
    async refresh(options = {}) {
      const silent = options.silent === true;
      if (!silent) {
        this.loading = true;
        this.pageToken = null;
      } else if (this.pageToken) {
        return;
      }
      this.error = silent ? this.error : "";
      try {
        const page = await badmintonClient.listMyNotifications({
          unread: this.unreadFilter,
          limit: PAGE_SIZE,
        });
        this.items = page?.items || [];
        if (!silent) {
          this.pageToken = page?.pageToken || null;
        }
        if (this.unreadFilter) {
          publishUnreadCount(unreadCountFromPage(page, PAGE_SIZE));
        }
        this.loadedOnce = true;
      } catch (e) {
        if (!silent) {
          this.error = e?.message || this.$t("badminton.notifications.errLoad");
          if (!this.loadedOnce) this.items = [];
        }
      } finally {
        if (!silent) this.loading = false;
      }
    },
    poll() {
      if (this.busyId || this.loading || this.loadingMore) return;
      this.pollNotifications();
    },
    async pollNotifications() {
      try {
        const unreadPage = await badmintonClient.listMyNotifications({
          unread: true,
          limit: PAGE_SIZE,
        });
        const unreadItems = unreadPage?.items || [];
        publishUnreadCount(unreadCountFromPage(unreadPage, PAGE_SIZE));
        if (this.unreadFilter && !this.pageToken) {
          this.items = unreadItems;
          this.loadedOnce = true;
        }
      } catch {
        // ignore background poll errors
      }
    },
    async loadMore() {
      if (!this.pageToken || this.loadingMore) return;
      this.loadingMore = true;
      this.error = "";
      try {
        const page = await badmintonClient.listMyNotifications({
          unread: this.unreadFilter,
          limit: PAGE_SIZE,
          pageToken: this.pageToken,
        });
        this.items = [...this.items, ...(page?.items || [])];
        this.pageToken = page?.pageToken || null;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.notifications.errLoad");
      } finally {
        this.loadingMore = false;
      }
    },
    async switchFilter() {
      this.unreadFilter = !this.unreadFilter;
      await this.refresh();
    },
    async markRead(item) {
      if (!item?.id || item.unread === false) return;
      this.busyId = item.id;
      this.error = "";
      try {
        await badmintonClient.markNotificationRead(item.id);
        this.items = this.items.filter((row) => row.id !== item.id);
      } catch (e) {
        this.error = e?.message || this.$t("badminton.notifications.errMarkRead");
      } finally {
        this.busyId = null;
      }
    },
    async accept(item) {
      if (!item?.invitationId) return;
      this.busyId = item.id;
      this.error = "";
      try {
        await badmintonClient.respondToInvitation(item.invitationId, "accept");
        await this.refresh();
      } catch (e) {
        this.error = e?.message || this.$t("badminton.notifications.errAccept");
      } finally {
        this.busyId = null;
      }
    },
    async reject(item) {
      if (!item?.invitationId) return;
      this.busyId = item.id;
      this.error = "";
      try {
        await badmintonClient.respondToInvitation(item.invitationId, "reject");
        await this.refresh();
      } catch (e) {
        this.error = e?.message || this.$t("badminton.notifications.errReject");
      } finally {
        this.busyId = null;
      }
    },
    onDocPointer(event) {
      if (!this.open) return;
      const root = this.$refs.root;
      if (root && !root.contains(event.target)) this.open = false;
    },
    onDocKey(event) {
      if (event.key === "Escape") this.open = false;
    },
  },
});
</script>

<style scoped>
.bellRoot {
  position: relative;
  flex-shrink: 0;
}

.bellBtn {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 100px;
  border: 2px solid #4f3dff;
  background: #ffffff;
  color: #4f3dff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.bellIcon {
  width: 22px;
  height: 22px;
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 100px;
  background: #ff6b6b;
  color: #fff;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  box-sizing: border-box;
}

.panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: min(360px, calc(100vw - 40px));
  max-height: min(70vh, 480px);
  overflow: auto;
  background: #ffffff;
  border: 2px solid #4f3dff;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(20, 16, 60, 0.16);
  z-index: 40;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  box-sizing: border-box;
}

.panelHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.panelTitle {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
}

.linkBtn {
  border: none;
  background: transparent;
  color: #4f3dff;
  cursor: pointer;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 14px;
  padding: 0;
}

.linkBtn:disabled {
  opacity: 0.6;
  cursor: default;
}

.footerBtn {
  align-self: flex-start;
  padding: 4px 0;
}

.panelError {
  background: #ffe6e6;
  border: 1px solid #ffb3b3;
  border-radius: 10px;
  padding: 8px 10px;
  font-family: var(--font-display);
  font-size: 14px;
}

.panelEmpty {
  font-family: var(--font-display);
  opacity: 0.7;
  padding: 8px 2px;
}

.panelList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notifItem {
  background: #f6f6ff;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notifItem.unread {
  background: #ebe7ff;
}

.notifTitle {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 15px;
}

.notifMeta {
  font-family: var(--font-display);
  opacity: 0.7;
  font-size: 13px;
  margin-top: 2px;
}

.notifActions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.actionBtn {
  border: none;
  cursor: pointer;
  background: #4f3dff;
  color: #fff;
  border-radius: 100px;
  padding: 8px 12px;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
}

.actionBtn.secondary {
  background: #fff;
  color: #4f3dff;
  border: 2px solid #4f3dff;
}

.actionBtn:disabled {
  opacity: 0.7;
  cursor: default;
}

@media (max-width: 768px) {
  .bellBtn {
    width: 38px;
    height: 38px;
  }

  .bellIcon {
    width: 18px;
    height: 18px;
  }
}

@media (prefers-color-scheme: dark) {
  .bellBtn {
    background: #2d2d2d;
    border-color: #b8a8ff;
    color: #b8a8ff;
  }

  .panel {
    background: #2d2d2d;
    border-color: #b8a8ff;
  }

  .notifItem {
    background: #3a3a48;
  }

  .notifItem.unread {
    background: #45405c;
  }

  .notifTitle {
    color: #e8e8e8;
  }

  .notifMeta {
    color: #b0b0b0;
  }

  .panelTitle {
    color: #e8e8e8;
  }

  .panelEmpty {
    color: #b0b0b0;
  }

  .actionBtn.secondary {
    background: #2d2d2d;
    border-color: #b8a8ff;
    color: #b8a8ff;
  }
}
</style>
