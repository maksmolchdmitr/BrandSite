<template>
  <div class="page">
    <div class="content">
      <div class="topRow">
        <div>
          <h1 class="title">{{ $t('badminton.notifications.title') }}</h1>
          <p class="subtitle">{{ $t('badminton.notifications.subtitle') }}</p>
        </div>
        <LocaleSwitcher />
      </div>

      <BadmintonHubCtaRow current="notifications" :disabled="loading" @logout="logout" />

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div class="card">
        <button class="btn secondary" :disabled="loading" @click="refresh">
          <LoadingPhrase v-if="loading" :text="$t('common.actions.loading')" />
          <template v-else>{{ $t('common.actions.refresh') }}</template>
        </button>

        <div v-if="!loading && items.length === 0" class="empty">
          {{ $t('badminton.notifications.empty') }}
        </div>

        <div v-else class="list">
          <div v-for="item in items" :key="item.id" class="notifRow">
            <div class="notifBody">
              <div class="notifTitle">{{ item.groupName || item.groupId }}</div>
              <div class="notifMeta">{{ formatKind(item.kind) }}</div>
            </div>
            <div v-if="canResolve(item)" class="actions">
              <button class="btn" :disabled="busyId === item.id" @click="accept(item)">
                {{ $t('badminton.notifications.accept') }}
              </button>
              <button class="btn secondary" :disabled="busyId === item.id" @click="reject(item)">
                {{ $t('badminton.notifications.reject') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import BadmintonHubCtaRow from "@/components/badminton/BadmintonHubCtaRow.vue";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";
import LoadingPhrase from "@/components/LoadingPhrase.vue";
import {badmintonClient} from "@/badminton/client.js";
import {redirectToLoginAutoTg} from "@/badminton/apiHelpers.js";

export default defineComponent({
  name: "BadmintonNotifications",
  components: {BadmintonHubCtaRow, LocaleSwitcher, LoadingPhrase},
  data() {
    return {
      loading: false,
      error: "",
      items: [],
      busyId: null,
    };
  },
  async mounted() {
    if (redirectToLoginAutoTg(this.$router)) return;
    await this.refresh();
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
    async refresh() {
      this.loading = true;
      this.error = "";
      try {
        const page = await badmintonClient.listMyNotifications();
        this.items = page?.items || [];
      } catch (e) {
        this.error = e?.message || this.$t("badminton.notifications.errLoad");
        this.items = [];
      } finally {
        this.loading = false;
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

.card { background: white; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px; max-width: 100%; min-width: 0; box-sizing: border-box; }
.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }
.empty { font-family: var(--font-display); opacity: 0.7; }

.list { display: flex; flex-direction: column; gap: 10px; }
.notifRow { background: #f6f6ff; border-radius: 14px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; min-width: 0; max-width: 100%; box-sizing: border-box; flex-wrap: wrap; }
.notifBody { min-width: 0; }
.notifTitle { font-family: var(--font-display); font-weight: 700; }
.notifMeta { font-family: var(--font-display); opacity: 0.7; margin-top: 4px; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }

.btn { flex: 0 0 auto; border: none; cursor: pointer; background-color: #4F3DFF; color: white; border-radius: 100px; padding: 12px 16px; font-family: var(--font-display); font-size: 16px; font-weight: 700; }
.btn.secondary { background: white; color: #4F3DFF; border: 2px solid #4F3DFF; }
.btn:disabled { opacity: 0.7; cursor: default; }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 16px 20px 20px 20px; }
  .title { font-size: 28px; }
}
</style>
