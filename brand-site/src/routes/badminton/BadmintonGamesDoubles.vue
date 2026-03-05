<template>
  <div class="page">
    <HeadBar :headItems="headItems" />
    <div class="content">
      <div class="topRow">
        <h1 class="title">Doubles Games</h1>
      </div>
      <div class="ctaRow">
        <RouterLink class="cta secondary cta-games" to="/?page=badminton&section=games">
          <span class="ctaText">← My games</span>
        </RouterLink>
        <RouterLink class="cta secondary cta-ratings" to="/?page=badminton&section=ratings">
          <span class="ctaText">My ratings</span>
        </RouterLink>
        <RouterLink class="cta secondary cta-groups" to="/?page=badminton&section=groups">
          <span class="ctaText">My groups</span>
        </RouterLink>
        <RouterLink class="cta secondary cta-back" to="/?page=products">
          <span class="ctaText">← Back to Products</span>
        </RouterLink>
      </div>
      <div v-if="error" class="errorBox">{{ error }}</div>
      <div class="card">
        <div class="cardTitle">Doubles Games</div>
        <div v-if="loading && pages.length === 0" class="empty">Loading...</div>
        <div v-else-if="currentItems.length === 0" class="empty">No doubles games yet.</div>
        <div v-else>
          <div class="tableWrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Team 1 P1</th>
                  <th>Team 1 P2</th>
                  <th>Score</th>
                  <th>Team 2 P1</th>
                  <th>Team 2 P2</th>
                  <th>Score</th>
                  <th>Date</th>
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
          <span class="stat">Played: <b>{{ stats.doubles?.matchesPlayed ?? 0 }}</b></span>
          <span class="stat">Won: <b>{{ stats.doubles?.matchesWon ?? 0 }}</b></span>
          <span class="stat">Lost: <b>{{ stats.doubles?.matchesLost ?? 0 }}</b></span>
          <span class="stat">Win rate: <b>{{ formatPct(stats.doubles?.winRate) }}</b></span>
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
      headItems: [
        { text: "Main", ref: "/?page=main", isMainSwitch: false },
        { text: "Products", ref: "/?page=products", isMainSwitch: false },
        { text: "Badminton", ref: "/?page=badminton&section=ratings", isMainSwitch: true },
      ],
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
        this.error = e?.message || "Failed to load doubles games";
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
        this.error = e?.message || "Failed to load next page";
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
@import url('https://fonts.googleapis.com/css2?family=Mali&display=swap');

.page { display: flex; flex-direction: column; gap: 64px; }
.content { padding: 0 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; }
.topRow { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
.title { margin: 0; font-family: 'Mali', 'sans-serif'; font-size: 40px; font-weight: 700; }
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
.ctaText { font-family: 'Mali', 'sans-serif'; font-size: 24px; font-weight: 700; color: white; }
.cta.secondary .ctaText { color: #4F3DFF; }
.card { background: white; border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.cardTitle { font-family: 'Mali', 'sans-serif'; font-weight: 700; font-size: 20px; color: #4F3DFF; }
.empty { font-family: 'Mali', 'sans-serif'; opacity: 0.7; padding: 20px; text-align: center; }
.statsRow { display: flex; gap: 20px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.stat { font-family: 'Mali', 'sans-serif'; font-size: 14px; }
.stat b { color: #4F3DFF; font-weight: 700; }
.tableWrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-family: 'Mali', 'sans-serif'; }
.table thead { background: #f6f6ff; }
.table th { padding: 14px 12px; text-align: left; font-weight: 700; font-size: 15px; color: #4F3DFF; border-bottom: 2px solid #e0e0ff; white-space: nowrap; }
.table td { padding: 12px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.table tbody tr:hover { background: #fafaff; }
.table tbody tr:last-child td { border-bottom: none; }
.nameCell { font-weight: 600; }
.scoreCell { font-weight: 700; color: #4F3DFF; text-align: center; }
.scoreCell.score21 { background-color: #ffeb3b; color: #333; border-radius: 4px; }
.dateCell { font-size: 13px; opacity: 0.8; white-space: nowrap; }
.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: 'Mali', 'sans-serif'; }
@media (max-width: 768px) { .content { padding: 0 20px 20px 20px; } .title { font-size: 28px; } .ctaText { font-size: 18px; } }
</style>
