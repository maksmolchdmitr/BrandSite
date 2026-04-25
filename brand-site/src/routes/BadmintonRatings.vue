<template>
  <div class="page">
    <HeadBar :headItems="localizedHeadItems"></HeadBar>

    <div class="content">
      <div class="topRow">
        <h1 class="title">{{ $t('badminton.ratings.title') }}</h1>
      </div>

      <div class="ctaRow">
        <RouterLink class="cta secondary cta-games" to="/?page=badminton&section=games">
          <span class="ctaText">{{ $t('badminton.ratings.myGames') }}</span>
        </RouterLink>
        <RouterLink class="cta secondary cta-groups" to="/?page=badminton&section=groups">
          <span class="ctaText">{{ $t('badminton.ratings.myGroups') }}</span>
        </RouterLink>
        <button class="cta secondary cta-logout" :disabled="loading" @click="handleLogout">
          <span class="ctaText">{{ $t('common.actions.logout') }}</span>
        </button>
        <RouterLink class="cta secondary cta-back" to="/?page=products">
          <span class="ctaText">{{ $t('common.actions.backToProducts') }}</span>
        </RouterLink>
      </div>

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div class="card">
        <div class="cardTitle">{{ $t('badminton.ratings.individual') }}</div>
        <p class="hint">{{ $t('badminton.ratings.ratingHint') }}</p>
        <div class="tableWrapper">
          <table class="table">
            <thead>
              <tr>
                <th>{{ $t('badminton.ratings.player') }}</th>
                <th>{{ $t('badminton.ratings.elo') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {{
                    ([me?.firstName, me?.lastName].filter(Boolean).join(" ") || me?.username || me?.id || $t('common.misc.noData'))
                  }}
                </td>
                <td class="eloCell">{{ ratings?.singlesElo ?? $t('common.misc.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="cardTitle">{{ $t('badminton.ratings.doublesByPartner') }}</div>
        <p class="hint">{{ $t('badminton.ratings.ratingHint') }}</p>
        <div v-if="currentDoublesPage.items.length === 0" class="empty">
          {{ $t('badminton.ratings.noDoubles') }}
        </div>
        <div v-else>
          <div class="tableWrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ $t('badminton.ratings.partner') }}</th>
                  <th>{{ $t('badminton.ratings.games') }}</th>
                  <th>{{ $t('badminton.ratings.wins') }}</th>
                  <th>{{ $t('badminton.ratings.losses') }}</th>
                  <th>{{ $t('badminton.ratings.elo') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in currentDoublesPage.items" :key="r.partnerUserId">
                  <td class="nameCell">{{ r.partnerName }}</td>
                  <td>{{ r.games }}</td>
                  <td>{{ r.wins }}</td>
                  <td>{{ r.losses }}</td>
                  <td class="eloCell">{{ r.elo }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="pagerRow">
            <button
              class="pagerButton"
              :disabled="!canGoPrevDoubles"
              @click="goPrevDoubles"
            >
              ←
            </button>
            <span class="pagerPage">{{ $t('common.pager.page', { page: doublesCurrentPageIndex + 1 }) }}</span>
            <button
              class="pagerButton"
              :disabled="!canGoNextDoubles"
              @click="goNextDoubles"
            >
              →
            </button>
            <div class="pagerLimit">
              <span class="pagerLimitLabel">{{ $t('common.pager.perPage') }}</span>
              <div class="pagerLimitSelect" @click="toggleDoublesLimitDropdown">
                <span>{{ doublesLimit }}</span>
                <span class="pagerLimitArrow">▾</span>
                <div
                  v-if="showDoublesLimitDropdown"
                  class="pagerLimitDropdown"
                >
                  <div
                    v-for="opt in doublesLimitOptions"
                    :key="opt"
                    class="pagerLimitOption"
                    :class="{ active: opt === doublesLimit }"
                    @click.stop="changeDoublesLimit(opt)"
                  >
                    {{ opt }}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
      error: "",
      me: null,
      ratings: null,
      doublesPages: [],
      doublesCurrentPageIndex: 0,
      doublesLimit: 10,
      doublesLimitOptions: [10, 20, 50],
      showDoublesLimitDropdown: false,
    };
  },
  computed: {
    localizedHeadItems() {
      return [
        { text: this.$t("common.nav.main"), ref: "/?page=main", isMainSwitch: false },
        { text: this.$t("common.nav.products"), ref: "/?page=products", isMainSwitch: false },
        { text: this.$t("common.nav.badminton"), ref: "/?page=badminton&section=ratings", isMainSwitch: true },
      ];
    },
    currentDoublesPage() {
      if (!this.doublesPages.length) {
        return { items: [], nextPageToken: null };
      }
      return this.doublesPages[this.doublesCurrentPageIndex] || { items: [], nextPageToken: null };
    },
    canGoPrevDoubles() {
      return this.doublesCurrentPageIndex > 0;
    },
    canGoNextDoubles() {
      const page = this.currentDoublesPage;
      return !!page.nextPageToken;
    },
  },
  async mounted() {
    await this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = "";
      try {
        const [me, ratings] = await Promise.all([
          badmintonClient.getMe(),
          badmintonClient.getMyRatings({ limit: this.doublesLimit }),
        ]);
        this.me = me;
        this.ratings = ratings;
        const first = {
          items: ratings?.doublesByPartner || [],
          nextPageToken: ratings?.doublesByPartnerPageToken || null,
        };
        this.doublesPages = [first];
        this.doublesCurrentPageIndex = 0;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.ratings.errLoad");
      } finally {
        this.loading = false;
      }
    },
    async goPrevDoubles() {
      if (!this.canGoPrevDoubles) return;
      this.doublesCurrentPageIndex = Math.max(0, this.doublesCurrentPageIndex - 1);
    },
    async goNextDoubles() {
      if (!this.canGoNextDoubles) return;
      const current = this.currentDoublesPage;
      const nextToken = current.nextPageToken;
      if (!nextToken) return;
      // If we already loaded this page (e.g. after changing page back and forth), just move index
      const existingIndex = this.doublesPages.findIndex(
        (p, idx) => idx > this.doublesCurrentPageIndex && p.pageTokenFrom === nextToken
      );
      if (existingIndex !== -1) {
        this.doublesCurrentPageIndex = existingIndex;
        return;
      }
      this.loading = true;
      this.error = "";
      try {
        const ratings = await badmintonClient.getMyRatings({
          limit: this.doublesLimit,
          pageToken: nextToken,
        });
        this.ratings = {
          ...this.ratings,
          singlesElo: ratings?.singlesElo ?? this.ratings?.singlesElo,
        };
        const page = {
          items: ratings?.doublesByPartner || [],
          nextPageToken: ratings?.doublesByPartnerPageToken || null,
          pageTokenFrom: nextToken,
        };
        this.doublesPages.push(page);
        this.doublesCurrentPageIndex = this.doublesPages.length - 1;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.ratings.errNext");
      } finally {
        this.loading = false;
      }
    },
    toggleDoublesLimitDropdown() {
      this.showDoublesLimitDropdown = !this.showDoublesLimitDropdown;
    },
    async changeDoublesLimit(limit) {
      if (this.doublesLimit === limit) {
        this.showDoublesLimitDropdown = false;
        return;
      }
      this.doublesLimit = limit;
      this.showDoublesLimitDropdown = false;
      await this.load();
    },
    async handleLogout() {
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
.linkBtn { text-decoration: none; font-family: var(--font-display); font-weight: 700; color: #4F3DFF; }
.logoutBtn { background: none; border: none; cursor: pointer; padding: 0; font-family: var(--font-display); font-weight: 700; color: #4F3DFF; }

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

/* My groups - зеленый */
.cta-groups.secondary {
  background-color: #E8F5E9;
  border-color: #4CAF50;
}
.cta-groups.secondary .ctaText {
  color: #4CAF50;
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

.card { background: white; border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.cardTitle { font-family: var(--font-display); font-weight: 700; font-size: 20px; color: #4F3DFF; }
.hint { font-family: var(--font-display); font-size: 13px; opacity: 0.7; margin-top: 8px; }
.empty { font-family: var(--font-display); opacity: 0.7; padding: 20px; text-align: center; }

.tableWrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-family: var(--font-display); }
.table thead { background: #f6f6ff; }
.table th { padding: 14px 16px; text-align: left; font-weight: 700; font-size: 16px; color: #4F3DFF; border-bottom: 2px solid #e0e0ff; }
.table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 15px; }
.table tbody tr:hover { background: #fafaff; }
.table tbody tr:last-child td { border-bottom: none; }
.nameCell { font-weight: 600; }
.eloCell { font-weight: 700; color: #4F3DFF; font-size: 16px; }

.pagerRow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.pagerButton {
  border: 2px solid #4F3DFF;
  background-color: white;
  border-radius: 999px;
  padding: 6px 14px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: #4F3DFF;
  cursor: pointer;
}

.pagerButton:disabled {
  opacity: 0.5;
  cursor: default;
}

.pagerPage {
  font-family: var(--font-display);
  font-size: 16px;
}

.pagerLimit {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
}

.pagerLimitLabel {
  font-family: var(--font-display);
  font-size: 14px;
}

.pagerLimitSelect {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 100px;
  border: 2px solid #4F3DFF;
  background-color: white;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: #4F3DFF;
  cursor: pointer;
}

.pagerLimitArrow {
  font-size: 10px;
}

.pagerLimitDropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  z-index: 10;
}

.pagerLimitOption {
  padding: 8px 12px;
  font-family: var(--font-display);
  font-size: 14px;
  cursor: pointer;
}

.pagerLimitOption:hover {
  background-color: #f6f6ff;
}

.pagerLimitOption.active {
  font-weight: 700;
  color: #4F3DFF;
}

.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 0 20px 20px 20px; }
  .title { font-size: 28px; }
  .card { padding: 16px; }
  .table th, .table td { padding: 10px 12px; font-size: 14px; }
  .ctaText { font-size: 18px; }
}

@media (prefers-color-scheme: dark) {
  .card {
    background: #2d2d2d;
    border: 1px solid #3b3b3b;
  }

  .table thead {
    background: #343434;
  }

  .table th {
    border-bottom-color: #4a4a4a;
  }

  .table td {
    border-bottom-color: #3b3b3b;
    color: #e8e8e8;
  }

  .table tbody tr:hover {
    background: #363636;
  }

  .btn.secondary,
  .cta.secondary,
  .pagerButton,
  .pagerLimitSelect {
    background-color: #2d2d2d;
  }

  .pagerLimitDropdown {
    background: #2d2d2d;
    border-color: #4a4a4a;
  }

  .pagerLimitOption:hover {
    background-color: #3a3a3a;
  }

  .errorBox {
    background: #4a1f1f;
    border-color: #8e3c3c;
    color: #ffd6d6;
  }
}
</style>


