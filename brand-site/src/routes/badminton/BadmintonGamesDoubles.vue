<template>
  <div class="page">
    <HeadBar :headItems="localizedHeadItems" />
    <div class="content">
      <div class="topRow">
        <h1 class="title">{{ $t('badminton.doubles.title') }}</h1>
      </div>
      <div class="ctaRow">
        <RouterLink class="cta secondary cta-games" to="/?page=badminton&section=games">
          <span class="ctaText">{{ $t('badminton.doubles.backToGames') }}</span>
        </RouterLink>
        <RouterLink class="cta secondary cta-ratings" to="/?page=badminton&section=ratings">
          <span class="ctaText">{{ $t('badminton.doubles.myRatings') }}</span>
        </RouterLink>
        <RouterLink class="cta secondary cta-groups" to="/?page=badminton&section=groups">
          <span class="ctaText">{{ $t('badminton.doubles.myGroups') }}</span>
        </RouterLink>
        <RouterLink class="cta secondary cta-back" to="/?page=products">
          <span class="ctaText">{{ $t('common.actions.backToProducts') }}</span>
        </RouterLink>
      </div>
      <div v-if="error" class="errorBox">{{ error }}</div>
      <div class="card">
        <div class="cardTitle">{{ $t('badminton.doubles.cardTitle') }}</div>
        <div v-if="loading && pages.length === 0" class="empty">{{ $t('common.actions.loading') }}</div>
        <div v-else-if="currentItems.length === 0" class="empty">{{ $t('badminton.doubles.empty') }}</div>
        <div v-else>
          <div class="tableWrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ $t('badminton.doubles.team1p1') }}</th>
                  <th>{{ $t('badminton.doubles.team1p2') }}</th>
                  <th>{{ $t('badminton.doubles.score') }}</th>
                  <th>{{ $t('badminton.doubles.team2p1') }}</th>
                  <th>{{ $t('badminton.doubles.team2p2') }}</th>
                  <th>{{ $t('badminton.doubles.score') }}</th>
                  <th>{{ $t('badminton.doubles.date') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in currentItems" :key="m.id">
                  <td class="nameCell">{{ getParticipantName(m.teamA?.[0]) }}</td>
                  <td class="nameCell">{{ getParticipantName(m.teamA?.[1]) }}</td>
                  <td class="scoreCell" :class="{ score21: getFinalScore(m, 'A') === 21 }">{{ getFinalScore(m, 'A') }}</td>
                  <td class="nameCell">{{ getParticipantName(m.teamB?.[0]) }}</td>
                  <td class="nameCell">{{ getParticipantName(m.teamB?.[1]) }}</td>
                  <td class="scoreCell" :class="{ score21: getFinalScore(m, 'B') === 21 }">{{ getFinalScore(m, 'B') }}</td>
                  <td class="dateCell">{{ formatDate(m.startedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <PagerBar
            :current-page-index="pageIndex"
            :can-go-prev="pageIndex > 0"
            :can-go-next="canGoNext"
            :limit="limit"
            :limit-options="limitOptions"
            :show-limit-dropdown="showLimitDropdown"
            @prev="goPrev"
            @next="goNext"
            @toggle-limit="showLimitDropdown = !showLimitDropdown"
            @change-limit="changeLimit"
          />
        </div>
        <div v-if="stats" class="statsRow">
          <span class="stat">{{ $t('badminton.doubles.played') }}: <b>{{ stats.doubles?.matchesPlayed ?? 0 }}</b></span>
          <span class="stat">{{ $t('badminton.doubles.won') }}: <b>{{ stats.doubles?.matchesWon ?? 0 }}</b></span>
          <span class="stat">{{ $t('badminton.doubles.lost') }}: <b>{{ stats.doubles?.matchesLost ?? 0 }}</b></span>
          <span class="stat">{{ $t('badminton.doubles.winRate') }}: <b>{{ formatPct(stats.doubles?.winRate) }}</b></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import HeadBar from "@/components/HeadBar.vue";
import PagerBar from "@/components/badminton/PagerBar.vue";
import { badmintonClient } from "@/badminton/client.js";
import { matchFormatMixin } from "@/routes/badminton/matchFormatMixin.js";

export default defineComponent({
  name: "BadmintonGamesDoubles",
  components: { HeadBar, PagerBar },
  mixins: [matchFormatMixin],
  data() {
    return {
      loading: false,
      error: "",
      stats: null,
      pages: [],
      pageIndex: 0,
      limit: 10,
      limitOptions: [10, 20, 50],
      showLimitDropdown: false,
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
    currentPage() {
      if (!this.pages.length) return { items: [], pageToken: null };
      return this.pages[this.pageIndex] || { items: [], pageToken: null };
    },
    currentItems() {
      return this.currentPage.items || [];
    },
    canGoNext() {
      const n = this.currentItems.length;
      if (n < this.limit && this.pageIndex === 0) return false;
      if (n < this.limit && this.pageIndex > 0) return false;
      return !!this.currentPage.pageToken;
    },
  },
  async mounted() {
    await this.loadParticipantNames();
    await this.loadStats();
    await this.loadFirstPage();
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
    async loadFirstPage() {
      this.loading = true;
      this.error = "";
      try {
        const res = await badmintonClient.getMyDoublesMatches({ limit: this.limit });
        this.pages = [{ items: res?.items || [], pageToken: res?.pageToken || null }];
        this.pageIndex = 0;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.doubles.errLoad");
      } finally {
        this.loading = false;
      }
    },
    goPrev() {
      if (this.pageIndex > 0) this.pageIndex--;
    },
    async goNext() {
      if (!this.canGoNext) return;
      const nextToken = this.currentPage.pageToken;
      if (!nextToken) return;
      const existing = this.pages.findIndex((p, i) => i > this.pageIndex && p.pageTokenFrom === nextToken);
      if (existing !== -1) {
        this.pageIndex = existing;
        return;
      }
      this.loading = true;
      try {
        const res = await badmintonClient.getMyDoublesMatches({ limit: this.limit, pageToken: nextToken });
        this.pages.push({
          items: res?.items || [],
          pageToken: res?.pageToken || null,
          pageTokenFrom: nextToken,
        });
        this.pageIndex = this.pages.length - 1;
      } catch (e) {
        this.error = e?.message || this.$t("badminton.doubles.errNext");
      } finally {
        this.loading = false;
      }
    },
    async changeLimit(limit) {
      if (this.limit === limit) {
        this.showLimitDropdown = false;
        return;
      }
      this.limit = limit;
      this.showLimitDropdown = false;
      await this.loadFirstPage();
    },
  },
});
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 64px; }
.content { padding: 0 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; }
.topRow { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
.title { margin: 0; font-family: var(--font-display); font-size: 40px; font-weight: 700; }
.ctaRow { display: flex; gap: 16px; flex-wrap: wrap; }
.cta { text-decoration: none; background-color: #4F3DFF; border-radius: 100px; padding: 16px 22px; display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer; }
.cta.secondary { background-color: white; border: 2px solid #4F3DFF; }
.cta-games.secondary { background-color: #E3F2FD; border-color: #2196F3; }
.cta-games.secondary .ctaText { color: #2196F3; }
.cta-ratings.secondary { background-color: #F3E5F5; border-color: #9C27B0; }
.cta-ratings.secondary .ctaText { color: #9C27B0; }
.cta-groups.secondary { background-color: #E8F5E9; border-color: #4CAF50; }
.cta-groups.secondary .ctaText { color: #4CAF50; }
.cta-back.secondary { background-color: #F5F5F5; border-color: #888888; }
.cta-back.secondary .ctaText { color: #888888; }
.cta:disabled { cursor: default; opacity: 0.7; }
.ctaText { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: white; }
.cta.secondary .ctaText { color: #4F3DFF; }
.card { background: white; border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.cardTitle { font-family: var(--font-display); font-weight: 700; font-size: 20px; color: #4F3DFF; }
.empty { font-family: var(--font-display); opacity: 0.7; padding: 20px; text-align: center; }
.statsRow { display: flex; gap: 20px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.stat { font-family: var(--font-display); font-size: 14px; }
.stat b { color: #4F3DFF; font-weight: 700; }
.tableWrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-family: var(--font-display); }
.table thead { background: #f6f6ff; }
.table th { padding: 14px 12px; text-align: left; font-weight: 700; font-size: 15px; color: #4F3DFF; border-bottom: 2px solid #e0e0ff; white-space: nowrap; }
.table td { padding: 12px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.table tbody tr:hover { background: #fafaff; }
.table tbody tr:last-child td { border-bottom: none; }
.nameCell { font-weight: 600; }
.scoreCell { font-weight: 700; color: #4F3DFF; text-align: center; }
.scoreCell.score21 { background-color: #ffeb3b; color: #333; border-radius: 4px; }
.dateCell { font-size: 13px; opacity: 0.8; white-space: nowrap; }
.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }
@media (max-width: 768px) { .content { padding: 0 20px 20px 20px; } .title { font-size: 28px; } .ctaText { font-size: 18px; } }
</style>
