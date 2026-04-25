<template>
  <div class="page">
    <HeadBar :headItems="localizedHeadItems"></HeadBar>

    <div class="content">
      <div class="topRow">
        <h1 class="title">{{ $t('badminton.groups.title') }}</h1>
      </div>

      <div class="ctaRow">
        <RouterLink class="cta secondary cta-ratings" to="/?page=badminton&section=ratings">
          <span class="ctaText">{{ $t('badminton.groups.myRatings') }}</span>
        </RouterLink>
        <RouterLink class="cta secondary cta-games" to="/?page=badminton&section=games">
          <span class="ctaText">{{ $t('badminton.groups.myGames') }}</span>
        </RouterLink>
        <button class="cta secondary cta-logout" :disabled="loading" @click="logout">
          <span class="ctaText">{{ $t('common.actions.logout') }}</span>
        </button>
        <RouterLink class="cta secondary cta-back" to="/?page=products">
          <span class="ctaText">{{ $t('common.actions.backToProducts') }}</span>
        </RouterLink>
      </div>

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div class="card">
        <div class="cardTitle">{{ $t('badminton.groups.createGroup') }}</div>
        <div class="row">
          <input class="input" v-model="newGroupName" :placeholder="$t('badminton.groups.groupName')" />
          <button class="btn" :disabled="loadingCreate || !newGroupName" @click="create">
            {{ loadingCreate ? $t('badminton.groups.creating') : $t('common.actions.create') }}
          </button>
        </div>
      </div>

      <div class="card">
        <div class="cardTitle">{{ $t('badminton.groups.groups') }}</div>
        <button class="btn secondary" :disabled="loading" @click="load">
          {{ loading ? $t('common.actions.loading') : $t('common.actions.refresh') }}
        </button>

        <div v-if="groups.length === 0 && !loading" class="empty">{{ $t('badminton.groups.noGroups') }}</div>

        <div class="list">
          <RouterLink v-for="g in groups" :key="g.id" class="groupRow" :to="`/?page=badminton&section=groups&groupId=${g.id}`">
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
import {badmintonClient} from "@/badminton/client.js";

export default defineComponent({
  components: {HeadBar},
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
      return [
        { text: this.$t("common.nav.main"), ref: "/?page=main", isMainSwitch: false },
        { text: this.$t("common.nav.products"), ref: "/?page=products", isMainSwitch: false },
        { text: this.$t("common.nav.badminton"), ref: "/?page=badminton&section=ratings", isMainSwitch: true },
      ];
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
        this.$router.push(`/?page=badminton&section=groups&groupId=${g.id}`);
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
.page { display: flex; flex-direction: column; gap: 64px; }
.content { padding: 0 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; }
.topRow { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.topActions { display: flex; gap: 12px; flex-wrap: wrap; }
.title { margin: 0; font-family: var(--font-display); font-size: 40px; font-weight: 700; }

.card { background: white; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.cardTitle { font-family: var(--font-display); font-weight: 700; font-size: 18px; }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

.input { padding: 12px 14px; border-radius: 12px; border: 1px solid #ddd; font-family: var(--font-display); font-size: 16px; min-width: min(520px, calc(100vw - 140px)); }

.btn { border: none; cursor: pointer; background-color: #4F3DFF; color: white; border-radius: 100px; padding: 12px 16px; font-family: var(--font-display); font-size: 16px; font-weight: 700; }
.btn.secondary { background: white; color: #4F3DFF; border: 2px solid #4F3DFF; }
.btn:disabled { opacity: 0.7; cursor: default; }

.linkBtn { text-decoration: none; font-family: var(--font-display); font-weight: 700; color: #4F3DFF; }

.ctaRow {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.cta {
  text-decoration: none;
  background-color: #4F3DFF;
  border-radius: 100px;
  padding: 16px 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

.cta.secondary {
  background-color: white;
  border: 2px solid #4F3DFF;
}

/* My ratings - фиолетовый */
.cta-ratings.secondary {
  background-color: #F3E5F5;
  border-color: #9C27B0;
}
.cta-ratings.secondary .ctaText {
  color: #9C27B0;
}

/* My games - яркий синий */
.cta-games.secondary {
  background-color: #E3F2FD;
  border-color: #2196F3;
}
.cta-games.secondary .ctaText {
  color: #2196F3;
}

/* Logout - красноватый */
.cta-logout.secondary {
  background-color: #FFE8E8;
  border-color: #FF6B6B;
}
.cta-logout.secondary .ctaText {
  color: #FF6B6B;
}

/* Back to Products - серый */
.cta-back.secondary {
  background-color: #F5F5F5;
  border-color: #888888;
}
.cta-back.secondary .ctaText {
  color: #888888;
}

.cta:disabled {
  cursor: default;
  opacity: 0.7;
}

.ctaText {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.cta.secondary .ctaText {
  color: #4F3DFF;
}

.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }
.empty { font-family: var(--font-display); opacity: 0.7; margin-top: 8px; }

.list { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
.groupRow { text-decoration: none; color: inherit; background: #f6f6ff; border-radius: 14px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.groupName { font-family: var(--font-display); font-weight: 700; }
.groupMeta { display: flex; align-items: center; gap: 10px; }
.pill { background: white; border: 1px solid rgba(79,61,255,0.35); color: #4F3DFF; padding: 4px 10px; border-radius: 999px; font-family: var(--font-display); font-size: 14px; font-weight: 700; }
.pill.admin { background: #4F3DFF; color: white; border-color: #4F3DFF; }
.arrow { font-weight: 700; color: #4F3DFF; }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 0 20px 20px 20px; }
  .title { font-size: 28px; }
  .input { min-width: calc(100vw - 40px); }
  .ctaText { font-size: 18px; }
}
</style>


