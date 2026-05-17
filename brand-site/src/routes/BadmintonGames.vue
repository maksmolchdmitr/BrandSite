<template>
  <div class="page">
    <HeadBar :headItems="localizedHeadItems" />
    <div class="content">
      <div class="topRow">
        <h1 class="title">{{ $t("badminton.gamesHub.title") }}</h1>
      </div>
      <div class="ctaRow">
        <RouterLink class="cta secondary cta-ratings" to="/?page=badminton&section=ratings">
          <span class="ctaText">{{ $t("badminton.groups.myRatings") }}</span>
        </RouterLink>
        <RouterLink class="cta secondary cta-groups" to="/?page=badminton&section=groups">
          <span class="ctaText">{{ $t("badminton.singles.myGroups") }}</span>
        </RouterLink>
        <button class="cta secondary cta-logout" type="button" :disabled="loading" @click="logout">
          <span class="ctaText">{{ $t("common.actions.logout") }}</span>
        </button>
        <RouterLink class="cta secondary cta-back" to="/?page=products">
          <span class="ctaText">{{ $t("common.actions.backToProducts") }}</span>
        </RouterLink>
      </div>
      <BadmintonPillNav :items="gamesNavItems" aria-label="games kind" />
      <div v-if="error" class="errorBox">{{ error }}</div>
      <div class="card">
        <div class="cardTitle">{{ cardTitle }}</div>
        <div v-if="loading && currentPages.length === 0" class="empty">{{ $t("common.actions.loading") }}</div>
        <div v-else-if="currentItems.length === 0" class="empty">{{ emptyMessage }}</div>
        <div v-else-if="effectiveTab === 'singles'">
          <div class="tableWrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ $t("badminton.singles.player1") }}</th>
                  <th>{{ $t("badminton.singles.score") }}</th>
                  <th>{{ $t("badminton.singles.player2") }}</th>
                  <th>{{ $t("badminton.singles.score") }}</th>
                  <th>{{ $t("badminton.singles.date") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in currentItems" :key="m.id">
                  <td class="nameCell">{{ getParticipantName(m.teamA?.[0]) }}</td>
                  <td class="scoreCell" :class="{ score21: getFinalScore(m, 'A') === 21 }">{{ getFinalScore(m, "A") }}</td>
                  <td class="nameCell">{{ getParticipantName(m.teamB?.[0]) }}</td>
                  <td class="scoreCell" :class="{ score21: getFinalScore(m, 'B') === 21 }">{{ getFinalScore(m, "B") }}</td>
                  <td class="dateCell">{{ formatDate(m.startedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <PagerBar
            :current-page-index="singlesPageIndex"
            :can-go-prev="singlesPageIndex > 0"
            :can-go-next="canGoNextSingles"
            :limit="singlesLimit"
            :limit-options="limitOptions"
            :show-limit-dropdown="showSinglesLimitDropdown"
            @prev="goPrevSingles"
            @next="goNextSingles"
            @toggle-limit="showSinglesLimitDropdown = !showSinglesLimitDropdown"
            @change-limit="changeSinglesLimit"
          />
        </div>
        <div v-else>
          <div class="tableWrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ $t("badminton.doubles.team1p1") }}</th>
                  <th>{{ $t("badminton.doubles.team1p2") }}</th>
                  <th>{{ $t("badminton.doubles.score") }}</th>
                  <th>{{ $t("badminton.doubles.team2p1") }}</th>
                  <th>{{ $t("badminton.doubles.team2p2") }}</th>
                  <th>{{ $t("badminton.doubles.score") }}</th>
                  <th>{{ $t("badminton.doubles.date") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in currentItems" :key="m.id">
                  <td class="nameCell">{{ getParticipantName(m.teamA?.[0]) }}</td>
                  <td class="nameCell">{{ getParticipantName(m.teamA?.[1]) }}</td>
                  <td class="scoreCell" :class="{ score21: getFinalScore(m, 'A') === 21 }">{{ getFinalScore(m, "A") }}</td>
                  <td class="nameCell">{{ getParticipantName(m.teamB?.[0]) }}</td>
                  <td class="nameCell">{{ getParticipantName(m.teamB?.[1]) }}</td>
                  <td class="scoreCell" :class="{ score21: getFinalScore(m, 'B') === 21 }">{{ getFinalScore(m, "B") }}</td>
                  <td class="dateCell">{{ formatDate(m.startedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <PagerBar
            :current-page-index="doublesPageIndex"
            :can-go-prev="doublesPageIndex > 0"
            :can-go-next="canGoNextDoubles"
            :limit="doublesLimit"
            :limit-options="limitOptions"
            :show-limit-dropdown="showDoublesLimitDropdown"
            @prev="goPrevDoubles"
            @next="goNextDoubles"
            @toggle-limit="showDoublesLimitDropdown = !showDoublesLimitDropdown"
            @change-limit="changeDoublesLimit"
          />
        </div>
        <div v-if="stats" class="statsRow">
          <template v-if="effectiveTab === 'singles'">
            <span class="stat">{{ $t("badminton.singles.played") }}: <b>{{ stats.singles?.matchesPlayed ?? 0 }}</b></span>
            <span class="stat">{{ $t("badminton.singles.won") }}: <b>{{ stats.singles?.matchesWon ?? 0 }}</b></span>
            <span class="stat">{{ $t("badminton.singles.lost") }}: <b>{{ stats.singles?.matchesLost ?? 0 }}</b></span>
            <span class="stat">{{ $t("badminton.singles.winRate") }}: <b>{{ formatPct(stats.singles?.winRate) }}</b></span>
          </template>
          <template v-else>
            <span class="stat">{{ $t("badminton.doubles.played") }}: <b>{{ stats.doubles?.matchesPlayed ?? 0 }}</b></span>
            <span class="stat">{{ $t("badminton.doubles.won") }}: <b>{{ stats.doubles?.matchesWon ?? 0 }}</b></span>
            <span class="stat">{{ $t("badminton.doubles.lost") }}: <b>{{ stats.doubles?.matchesLost ?? 0 }}</b></span>
            <span class="stat">{{ $t("badminton.doubles.winRate") }}: <b>{{ formatPct(stats.doubles?.winRate) }}</b></span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import HeadBar from "@/components/HeadBar.vue";
import PagerBar from "@/components/badminton/PagerBar.vue";
import BadmintonPillNav from "@/components/badminton/BadmintonPillNav.vue";
import { getDefaultBadmintonHeadItems } from "@/badminton/headItems.js";
import { badmintonClient } from "@/badminton/client.js";
import { matchFormatMixin } from "@/routes/badminton/matchFormatMixin.js";

export default defineComponent({
  name: "BadmintonGames",
  components: { HeadBar, PagerBar, BadmintonPillNav },
  mixins: [matchFormatMixin],
  props: {
    gamesTab: { type: String, default: "singles" },
  },
  data() {
    return {
      loading: false,
      error: "",
      stats: null,
      singlesPages: [],
      singlesPageIndex: 0,
      singlesLimit: 10,
      showSinglesLimitDropdown: false,
      doublesPages: [],
      doublesPageIndex: 0,
      doublesLimit: 10,
      showDoublesLimitDropdown: false,
      limitOptions: [10, 20, 50],
    };
  },
  computed: {
    localizedHeadItems() {
      return getDefaultBadmintonHeadItems(this.$t);
    },
    effectiveTab() {
      return this.gamesTab === "doubles" ? "doubles" : "singles";
    },
    gamesNavItems() {
      const tab = this.effectiveTab;
      return [
        {
          to: "/?page=badminton&section=games&tab=singles",
          label: this.$t("badminton.groups.mySinglesMatches"),
          active: tab === "singles",
        },
        {
          to: "/?page=badminton&section=games&tab=doubles",
          label: this.$t("badminton.groups.myDoublesMatches"),
          active: tab === "doubles",
        },
      ];
    },
    currentSinglesPage() {
      if (!this.singlesPages.length) return { items: [], pageToken: null };
      return this.singlesPages[this.singlesPageIndex] || { items: [], pageToken: null };
    },
    currentDoublesPage() {
      if (!this.doublesPages.length) return { items: [], pageToken: null };
      return this.doublesPages[this.doublesPageIndex] || { items: [], pageToken: null };
    },
    currentPages() {
      return this.effectiveTab === "singles" ? this.singlesPages : this.doublesPages;
    },
    currentItems() {
      return this.effectiveTab === "singles"
        ? this.currentSinglesPage.items || []
        : this.currentDoublesPage.items || [];
    },
    canGoNextSingles() {
      const n = (this.currentSinglesPage.items || []).length;
      if (n < this.singlesLimit && this.singlesPageIndex === 0) return false;
      if (n < this.singlesLimit && this.singlesPageIndex > 0) return false;
      return !!this.currentSinglesPage.pageToken;
    },
    canGoNextDoubles() {
      const n = (this.currentDoublesPage.items || []).length;
      if (n < this.doublesLimit && this.doublesPageIndex === 0) return false;
      if (n < this.doublesLimit && this.doublesPageIndex > 0) return false;
      return !!this.currentDoublesPage.pageToken;
    },
    cardTitle() {
      return this.effectiveTab === "singles"
        ? this.$t("badminton.singles.cardTitle")
        : this.$t("badminton.doubles.cardTitle");
    },
    emptyMessage() {
      return this.effectiveTab === "singles"
        ? this.$t("badminton.singles.empty")
        : this.$t("badminton.doubles.empty");
    },
  },
  watch: {
    gamesTab() {
      this.loadTabIfNeeded();
    },
  },
  async mounted() {
    await this.loadParticipantNames();
    await this.loadStats();
    await this.loadTabIfNeeded();
  },
  methods: {
    formatPct(x) {
      if (typeof x !== "number") return "—";
      return `${(x * 100).toFixed(1)}%`;
    },
    async loadStats() {
      try {
        this.stats = await badmintonClient.getMyGamesStats();
      } catch (e) {
        console.warn("Failed to load games stats", e);
      }
    },
    async loadTabIfNeeded() {
      if (this.effectiveTab === "singles") {
        if (this.singlesPages.length === 0) await this.loadSinglesFirstPage();
      } else if (this.doublesPages.length === 0) {
        await this.loadDoublesFirstPage();
      }
    },
    async loadSinglesFirstPage() {
      this.loading = true;
      this.error = "";
      try {
        const res = await badmintonClient.getMySinglesMatches({ limit: this.singlesLimit });
        this.singlesPages = [{ items: res?.items || [], pageToken: res?.pageToken || null }];
        this.singlesPageIndex = 0;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.singles.errLoad");
      } finally {
        this.loading = false;
      }
    },
    async loadDoublesFirstPage() {
      this.loading = true;
      this.error = "";
      try {
        const res = await badmintonClient.getMyDoublesMatches({ limit: this.doublesLimit });
        this.doublesPages = [{ items: res?.items || [], pageToken: res?.pageToken || null }];
        this.doublesPageIndex = 0;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.doubles.errLoad");
      } finally {
        this.loading = false;
      }
    },
    goPrevSingles() {
      if (this.singlesPageIndex > 0) this.singlesPageIndex--;
    },
    async goNextSingles() {
      if (!this.canGoNextSingles) return;
      const nextToken = this.currentSinglesPage.pageToken;
      if (!nextToken) return;
      const existing = this.singlesPages.findIndex((p, i) => i > this.singlesPageIndex && p.pageTokenFrom === nextToken);
      if (existing !== -1) {
        this.singlesPageIndex = existing;
        return;
      }
      this.loading = true;
      try {
        const res = await badmintonClient.getMySinglesMatches({ limit: this.singlesLimit, pageToken: nextToken });
        this.singlesPages.push({
          items: res?.items || [],
          pageToken: res?.pageToken || null,
          pageTokenFrom: nextToken,
        });
        this.singlesPageIndex = this.singlesPages.length - 1;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.singles.errNext");
      } finally {
        this.loading = false;
      }
    },
    async changeSinglesLimit(limit) {
      if (this.singlesLimit === limit) {
        this.showSinglesLimitDropdown = false;
        return;
      }
      this.singlesLimit = limit;
      this.showSinglesLimitDropdown = false;
      await this.loadSinglesFirstPage();
    },
    goPrevDoubles() {
      if (this.doublesPageIndex > 0) this.doublesPageIndex--;
    },
    async goNextDoubles() {
      if (!this.canGoNextDoubles) return;
      const nextToken = this.currentDoublesPage.pageToken;
      if (!nextToken) return;
      const existing = this.doublesPages.findIndex((p, i) => i > this.doublesPageIndex && p.pageTokenFrom === nextToken);
      if (existing !== -1) {
        this.doublesPageIndex = existing;
        return;
      }
      this.loading = true;
      try {
        const res = await badmintonClient.getMyDoublesMatches({ limit: this.doublesLimit, pageToken: nextToken });
        this.doublesPages.push({
          items: res?.items || [],
          pageToken: res?.pageToken || null,
          pageTokenFrom: nextToken,
        });
        this.doublesPageIndex = this.doublesPages.length - 1;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.doubles.errNext");
      } finally {
        this.loading = false;
      }
    },
    async changeDoublesLimit(limit) {
      if (this.doublesLimit === limit) {
        this.showDoublesLimitDropdown = false;
        return;
      }
      this.doublesLimit = limit;
      this.showDoublesLimitDropdown = false;
      await this.loadDoublesFirstPage();
    },
    async logout() {
      this.loading = true;
      try {
        await badmintonClient.logout();
        await this.$router.push("/?page=badminton&section=login");
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 64px;
  max-width: 100%;
  box-sizing: border-box;
}
.content {
  padding: 0 50px 50px 50px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
}
.topRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}
.title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 700;
}
.ctaRow {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  max-width: 100%;
  min-width: 0;
}
.cta {
  text-decoration: none;
  background-color: #4f3dff;
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
  border: 2px solid #4f3dff;
}
.cta-ratings.secondary {
  background-color: #f3e5f5;
  border-color: #9c27b0;
}
.cta-ratings.secondary .ctaText {
  color: #9c27b0;
}
.cta-groups.secondary {
  background-color: #e8f5e9;
  border-color: #4caf50;
}
.cta-groups.secondary .ctaText {
  color: #4caf50;
}
.cta-logout.secondary {
  background-color: #ffe8e8;
  border-color: #ff6b6b;
}
.cta-logout.secondary .ctaText {
  color: #ff6b6b;
}
.cta-back.secondary {
  background-color: #f5f5f5;
  border-color: #888;
}
.cta-back.secondary .ctaText {
  color: #888;
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
  color: #4f3dff;
}
.card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.cardTitle {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 20px;
  color: #4f3dff;
}
.empty {
  font-family: var(--font-display);
  opacity: 0.7;
  padding: 20px;
  text-align: center;
}
.statsRow {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
.stat {
  font-family: var(--font-display);
  font-size: 14px;
}
.stat b {
  color: #4f3dff;
  font-weight: 700;
}
.tableWrapper {
  overflow-x: auto;
  max-width: 100%;
  min-width: 0;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-display);
}
.table thead {
  background: #f6f6ff;
}
.table th {
  padding: 14px 12px;
  text-align: left;
  font-weight: 700;
  font-size: 15px;
  color: #4f3dff;
  border-bottom: 2px solid #e0e0ff;
  white-space: nowrap;
}
.table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}
.table tbody tr:hover {
  background: #fafaff;
}
.table tbody tr:last-child td {
  border-bottom: none;
}
.nameCell {
  font-weight: 600;
}
.scoreCell {
  font-weight: 700;
  color: #4f3dff;
  text-align: center;
}
.scoreCell.score21 {
  background-color: #ffeb3b;
  color: #333;
  border-radius: 4px;
}
.dateCell {
  font-size: 13px;
  opacity: 0.8;
  white-space: nowrap;
}
.errorBox {
  background: #ffe6e6;
  border: 1px solid #ffb3b3;
  padding: 12px 14px;
  border-radius: 12px;
  font-family: var(--font-display);
}
@media (max-width: 768px) {
  .content {
    padding: 0 20px 20px 20px;
  }
  .title {
    font-size: 28px;
  }
  .ctaText {
    font-size: 18px;
  }
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
  .cta.secondary {
    background-color: #2d2d2d;
  }
  .errorBox {
    background: #4a1f1f;
    border-color: #8e3c3c;
    color: #ffd6d6;
  }
}
</style>
