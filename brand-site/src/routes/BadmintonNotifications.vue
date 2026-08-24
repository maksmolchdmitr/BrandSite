<template>
  <div class="page">
    <div class="content">
      <div class="topRow">
        <div>
          <h1 class="title">{{ $t('badminton.notifications.title') }}</h1>
          <p class="subtitle">{{ $t('badminton.notifications.subtitle') }}</p>
        </div>
        <BadmintonTopActions />
      </div>

      <BadmintonHubCtaRow current="notifications" :disabled="loading" @logout="logout" />

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div class="card">
        <div class="toolbar">
          <button class="btn secondary" :disabled="loading" @click="refresh">
            <LoadingPhrase v-if="loading && items.length === 0" :text="$t('common.actions.loading')" />
            <template v-else>{{ $t('common.actions.refresh') }}</template>
          </button>
          <div class="filterHint">
            {{ unreadFilter ? $t('badminton.notifications.filterUnread') : $t('badminton.notifications.filterRead') }}
          </div>
        </div>

        <div v-if="!loading && items.length === 0" class="empty">
          {{ $t('badminton.notifications.empty') }}
        </div>

        <div v-else class="list">
          <div
            v-for="item in items"
            :key="item.id"
            class="notifRow"
            :class="{ unread: item.unread !== false }"
          >
            <div class="notifBody">
              <div class="notifTitle">{{ item.groupName || item.groupId }}</div>
              <div class="notifMeta">{{ formatKind(item.kind) }}</div>
            </div>
            <div class="actions">
              <button
                v-if="item.unread !== false"
                class="btn secondary"
                :disabled="busyId === item.id"
                @click="markRead(item)"
              >
                {{ $t('badminton.notifications.markRead') }}
              </button>
              <template v-if="canResolve(item)">
                <button class="btn" :disabled="busyId === item.id" @click="accept(item)">
                  {{ $t('badminton.notifications.accept') }}
                </button>
                <button class="btn secondary" :disabled="busyId === item.id" @click="reject(item)">
                  {{ $t('badminton.notifications.reject') }}
                </button>
              </template>
            </div>
          </div>
        </div>

        <button
          v-if="pageToken"
          class="btn secondary"
          :disabled="loadingMore"
          @click="loadMore"
        >
          <LoadingPhrase v-if="loadingMore" :text="$t('common.actions.loading')" />
          <template v-else>{{ $t('badminton.notifications.loadMore') }}</template>
        </button>

        <button
          v-if="!pageToken && !loading"
          class="btn secondary"
          :disabled="loading"
          @click="switchFilter"
        >
          {{ unreadFilter
            ? $t('badminton.notifications.viewRead')
            : $t('badminton.notifications.viewUnread') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import BadmintonHubCtaRow from "@/components/badminton/BadmintonHubCtaRow.vue";
import BadmintonTopActions from "@/components/badminton/BadmintonTopActions.vue";
import LoadingPhrase from "@/components/LoadingPhrase.vue";
import {badmintonClient} from "@/badminton/client.js";
import {redirectToLoginAutoTg} from "@/badminton/apiHelpers.js";
import {publishUnreadCount, unreadCountFromPage} from "@/badminton/notificationInbox.js";

const PAGE_SIZE = 20;
const NOTIFICATION_POLL_MS = 60_000;

export default defineComponent({
  name: "BadmintonNotifications",
  components: {BadmintonHubCtaRow, BadmintonTopActions, LoadingPhrase},
  data() {
    return {
      loading: false,
      loadingMore: false,
      error: "",
      items: [],
      pageToken: null,
      unreadFilter: true,
      busyId: null,
      loadedOnce: false,
      pollTimer: null,
    };
  },
  async mounted() {
    if (redirectToLoginAutoTg(this.$router)) return;
    await this.refresh();
    this.pollTimer = setInterval(() => this.poll(), NOTIFICATION_POLL_MS);
  },
  beforeUnmount() {
    if (this.pollTimer) clearInterval(this.pollTimer);
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
          this.items = [];
          this.pageToken = null;
        }
      } finally {
        if (!silent) this.loading = false;
      }
    },
    poll() {
      if (this.busyId || this.loading || this.loadingMore) return;
      this.refresh({ silent: true });
      if (!this.unreadFilter) this.refreshBadgeUnreadCount();
    },
    async refreshBadgeUnreadCount() {
      try {
        const unreadPage = await badmintonClient.listMyNotifications({
          unread: true,
          limit: PAGE_SIZE,
        });
        publishUnreadCount(unreadCountFromPage(unreadPage, PAGE_SIZE));
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
    async logout() {
      this.loading = true;
      this.error = "";
      try {
        await badmintonClient.logout();
        await this.$router.push("/?page=badminton&section=login");
      } catch (e) {
        this.error = e?.message || this.$t("badminton.login.errLogout");
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 64px; max-width: 100%; box-sizing: border-box; }
.content { padding: 24px 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; box-sizing: border-box; min-width: 0; }
.topRow { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.title { margin: 0 0 6px; font-family: var(--font-display); font-size: 40px; font-weight: 700; }
.subtitle { margin: 0; font-family: var(--font-display); opacity: 0.75; }

.card { background: white; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px; max-width: 100%; min-width: 0; box-sizing: border-box; color: #1a1a2e; color-scheme: light; }
.toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.filterHint { font-family: var(--font-display); color: #555; }
.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }
.empty { font-family: var(--font-display); color: #555; }

.list { display: flex; flex-direction: column; gap: 10px; }
.notifRow { background: #f6f6ff; border-radius: 14px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; min-width: 0; max-width: 100%; box-sizing: border-box; flex-wrap: wrap; }
.notifRow.unread { background: #ebe7ff; }
.notifBody { min-width: 0; }
.notifTitle { font-family: var(--font-display); font-weight: 700; color: #1a1a2e; }
.notifMeta { font-family: var(--font-display); color: #555; margin-top: 4px; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }

.btn { flex: 0 0 auto; border: none; cursor: pointer; background-color: #4F3DFF; color: white; border-radius: 100px; padding: 12px 16px; font-family: var(--font-display); font-size: 16px; font-weight: 700; }
.btn.secondary { background: white; color: #4F3DFF; border: 2px solid #4F3DFF; }
.btn:disabled { opacity: 0.7; cursor: default; }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 16px 20px 20px 20px; }
  .title { font-size: 28px; }
}

@media (prefers-color-scheme: dark) {
  .title,
  .subtitle {
    color: #e8e8e8;
  }

  .card {
    background: #2d2d2d;
    border: 1px solid #3b3b3b;
    color: #e8e8e8;
    color-scheme: dark;
  }

  .filterHint,
  .empty {
    color: #b0b0b0;
  }

  .notifRow {
    background: #242424;
  }

  .notifRow.unread {
    background: #353045;
  }

  .notifTitle {
    color: #e8e8e8;
  }

  .notifMeta {
    color: #b0b0b0;
  }

  .btn.secondary {
    background: #2d2d2d;
  }

  .errorBox {
    background: #4a1f1f;
    border-color: #8e3c3c;
    color: #ffd6d6;
  }
}
</style>
