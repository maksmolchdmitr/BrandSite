<template>
  <div class="page">
    <div class="content">
      <div class="topRow">
        <div>
          <h1 class="title">{{ $t('badminton.invitations.title') }}</h1>
          <p class="subtitle">{{ $t('badminton.invitations.subtitle') }}</p>
        </div>
        <div class="topActions">
          <LocaleSwitcher />
          <RouterLink class="btn secondary" to="/?page=badminton&section=groups">{{ $t('badminton.groups.groups') }}</RouterLink>
          <button class="btn secondary" :disabled="loading" @click="refresh">
            <LoadingPhrase v-if="loading" :text="$t('common.actions.loading')" />
            <template v-else>{{ $t('common.actions.refresh') }}</template>
          </button>
        </div>
      </div>

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div v-if="!loading && items.length === 0" class="empty">
        {{ $t('badminton.invitations.empty') }}
      </div>

      <div v-else class="list">
        <div v-for="inv in items" :key="inv.id" class="card">
          <div class="cardTitle">{{ inv.groupName || inv.groupId }}</div>
          <div class="meta">{{ formatKind(inv.kind) }}</div>
          <div class="actions">
            <button class="btn" :disabled="busyId === inv.id" @click="accept(inv)">
              {{ $t('badminton.invitations.accept') }}
            </button>
            <button class="btn secondary" :disabled="busyId === inv.id" @click="reject(inv)">
              {{ $t('badminton.invitations.reject') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";
import LoadingPhrase from "@/components/LoadingPhrase.vue";
import {badmintonClient} from "@/badminton/client.js";

export default {
  name: "BadmintonInvitations",
  components: {LocaleSwitcher, LoadingPhrase},
  data() {
    return {
      loading: false,
      error: "",
      items: [],
      busyId: null,
    };
  },
  async created() {
    await this.refresh();
  },
  methods: {
    formatKind(kind) {
      const key = `badminton.invitations.kinds.${kind}`;
      const translated = this.$t(key);
      return translated === key ? kind : translated;
    },
    async refresh() {
      this.loading = true;
      this.error = "";
      try {
        const page = await badmintonClient.listMyInvitations();
        this.items = page?.items || [];
      } catch (e) {
        this.error = e?.message || this.$t("badminton.invitations.errLoad");
        this.items = [];
      } finally {
        this.loading = false;
      }
    },
    async accept(inv) {
      this.busyId = inv.id;
      this.error = "";
      try {
        await badmintonClient.acceptInvitation(inv.id);
        this.items = this.items.filter(i => i.id !== inv.id);
      } catch (e) {
        this.error = e?.message || this.$t("badminton.invitations.errAccept");
      } finally {
        this.busyId = null;
      }
    },
    async reject(inv) {
      this.busyId = inv.id;
      this.error = "";
      try {
        await badmintonClient.rejectInvitation(inv.id);
        this.items = this.items.filter(i => i.id !== inv.id);
      } catch (e) {
        this.error = e?.message || this.$t("badminton.invitations.errReject");
      } finally {
        this.busyId = null;
      }
    },
  },
};
</script>

<style scoped>
.page { padding: 24px 16px 48px; }
.content { max-width: 720px; margin: 0 auto; }
.topRow { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
.topActions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.title { margin: 0 0 6px; font-size: 1.6rem; }
.subtitle { margin: 0; opacity: 0.75; }
.errorBox { margin-bottom: 12px; padding: 10px 12px; border: 1px solid #c44; border-radius: 8px; }
.empty { opacity: 0.7; }
.list { display: flex; flex-direction: column; gap: 12px; }
.card { padding: 14px 16px; border: 1px solid rgba(127,127,127,0.35); border-radius: 10px; }
.cardTitle { font-weight: 600; margin-bottom: 4px; }
.meta { opacity: 0.7; margin-bottom: 12px; font-size: 0.95rem; }
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn { cursor: pointer; }
</style>
