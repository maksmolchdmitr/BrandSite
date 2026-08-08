<template>
  <div class="page">
    <HeadBar :headItems="localizedHeadItems"></HeadBar>

    <div class="content">
      <div class="topRow">
        <h1 class="title">{{ $t('badminton.groups.title') }}</h1>
      </div>

      <BadmintonHubCtaRow current="groups" :disabled="loading" @logout="logout" />

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div class="card">
        <div class="cardTitle">{{ $t('badminton.groups.createGroup') }}</div>
        <div class="row">
          <input class="input" v-model="newGroupName" :placeholder="$t('badminton.groups.groupName')" />
          <button class="btn" :disabled="loadingCreate || !newGroupName" @click="create">
            <LoadingPhrase v-if="loadingCreate" :text="$t('badminton.groups.creating')" />
            <template v-else>{{ $t('common.actions.create') }}</template>
          </button>
        </div>
      </div>

      <div class="card">
        <div class="cardTitle">{{ $t('badminton.groups.groups') }}</div>
        <button class="btn secondary" :disabled="loading" @click="load">
          <LoadingPhrase v-if="loading" :text="$t('common.actions.loading')" />
          <template v-else>{{ $t('common.actions.refresh') }}</template>
        </button>

        <div v-if="groups.length === 0 && !loading" class="empty">{{ $t('badminton.groups.noGroups') }}</div>

        <div class="list">
          <RouterLink v-for="g in groups" :key="g.id" class="groupRow" :to="`/?page=badminton&section=groups&groupId=${g.id}&groupSection=matches&matchTab=singles`">
            <div class="groupName">{{ g.name }}</div>
            <div class="groupMeta">
              <span v-if="g.myRole" class="pill" :class="g.myRole === 'admin' ? 'admin' : ''">{{ formatRole(g.myRole) }}</span>
              <span class="arrow">→</span>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import HeadBar from "@/components/HeadBar.vue";
import BadmintonHubCtaRow from "@/components/badminton/BadmintonHubCtaRow.vue";
import {badmintonClient} from "@/badminton/client.js";
import { getDefaultBadmintonHeadItems } from "@/badminton/headItems.js";

export default defineComponent({
  components: {HeadBar, BadmintonHubCtaRow},
  data() {
    return {
      loading: false,
      loadingCreate: false,
      error: "",
      groups: [],
      newGroupName: "",
    };
  },
  mounted() {
    this.load();
  },
  computed: {
    localizedHeadItems() {
      return getDefaultBadmintonHeadItems(this.$t);
    },
  },
  methods: {
    formatRole(role) {
      if (role === "admin") return this.$t("badminton.roles.admin");
      if (role === "member") return this.$t("badminton.roles.member");
      return role;
    },
    async load() {
      this.loading = true;
      this.error = "";
      try {
        const res = await badmintonClient.getMyGroups();
        this.groups = Array.isArray(res) ? res : res.items || [];
      } catch (e) {
        this.error = e?.message || this.$t("badminton.groups.errLoad");
      } finally {
        this.loading = false;
      }
    },
    async create() {
      this.loadingCreate = true;
      this.error = "";
      try {
        const g = await badmintonClient.createGroup({name: this.newGroupName});
        this.newGroupName = "";
        this.groups = [g, ...this.groups];
        this.$router.push(`/?page=badminton&section=groups&groupId=${g.id}&groupSection=matches&matchTab=singles`);
      } catch (e) {
        this.error = e?.message || this.$t("badminton.groups.errCreate");
      } finally {
        this.loadingCreate = false;
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
.content { padding: 0 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; box-sizing: border-box; min-width: 0; }
.topRow { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.topActions { display: flex; gap: 12px; flex-wrap: wrap; }
.title { margin: 0; font-family: var(--font-display); font-size: 40px; font-weight: 700; }

.card { background: white; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px; max-width: 100%; min-width: 0; box-sizing: border-box; }
.cardTitle { font-family: var(--font-display); font-weight: 700; font-size: 18px; }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; width: 100%; min-width: 0; box-sizing: border-box; }

.input { padding: 12px 14px; border-radius: 12px; border: 1px solid #ddd; font-family: var(--font-display); font-size: 16px; flex: 1 1 0; min-width: 0; max-width: 100%; width: 0; box-sizing: border-box; }

.btn { flex: 0 0 auto; border: none; cursor: pointer; background-color: #4F3DFF; color: white; border-radius: 100px; padding: 12px 16px; font-family: var(--font-display); font-size: 16px; font-weight: 700; }
.btn.secondary { background: white; color: #4F3DFF; border: 2px solid #4F3DFF; }
.btn:disabled { opacity: 0.7; cursor: default; }

.linkBtn { text-decoration: none; font-family: var(--font-display); font-weight: 700; color: #4F3DFF; }

.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }
.empty { font-family: var(--font-display); opacity: 0.7; margin-top: 8px; }

.list { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
.groupRow { text-decoration: none; color: inherit; background: #f6f6ff; border-radius: 14px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; min-width: 0; max-width: 100%; box-sizing: border-box; }
.groupName { font-family: var(--font-display); font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.groupMeta { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.pill { background: white; border: 1px solid rgba(79,61,255,0.35); color: #4F3DFF; padding: 4px 10px; border-radius: 999px; font-family: var(--font-display); font-size: 14px; font-weight: 700; }
.pill.admin { background: #4F3DFF; color: white; border-color: #4F3DFF; }
.arrow { font-weight: 700; color: #4F3DFF; }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 0 20px 20px 20px; }
  .title { font-size: 28px; }
}

@media (prefers-color-scheme: dark) {
  .card {
    background: #2d2d2d;
    border: 1px solid #3b3b3b;
  }

  .input {
    background: #242424;
    border-color: #4a4a4a;
    color: #e8e8e8;
  }

  .btn.secondary {
    background-color: #2d2d2d;
  }

  .groupRow {
    background: #242424;
  }

  .groupName {
    color: #e8e8e8;
  }

  .pill {
    background: #2d2d2d;
    border-color: #6f62c6;
    color: #c7bcff;
  }

  .arrow {
    color: #c7bcff;
  }

  .errorBox {
    background: #4a1f1f;
    border-color: #8e3c3c;
    color: #ffd6d6;
  }
}
</style>


