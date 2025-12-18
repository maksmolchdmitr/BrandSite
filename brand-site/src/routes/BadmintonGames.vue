<template>
  <div class="page">
    <HeadBar :headItems="headItems"></HeadBar>

    <div class="content">
      <div class="topRow">
        <h1 class="title">My games</h1>
        <div class="topActions">
          <RouterLink class="linkBtn" to="/?page=badminton&section=ratings">My ratings</RouterLink>
          <RouterLink class="linkBtn" to="/?page=badminton&section=groups">My groups</RouterLink>
          <button class="linkBtn logoutBtn" @click="logout">Logout</button>
        </div>
      </div>

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div class="card">
        <div class="cardTitle">Singles Games</div>
        <div v-if="singlesMatches.length === 0" class="empty">No singles games yet.</div>
        <div v-else class="tableWrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Player 1</th>
                <th>Score</th>
                <th>Player 2</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in singlesMatches" :key="m.id">
                <td class="nameCell">{{ getParticipantName(m.teamA?.[0]) }}</td>
                <td class="scoreCell" :class="{score21: getFinalScore(m, 'A') === 21}">{{ getFinalScore(m, 'A') }}</td>
                <td class="nameCell">{{ getParticipantName(m.teamB?.[0]) }}</td>
                <td class="scoreCell" :class="{score21: getFinalScore(m, 'B') === 21}">{{ getFinalScore(m, 'B') }}</td>
                <td class="dateCell">{{ formatDate(m.startedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="statsRow">
          <span class="stat">Played: <b>{{ stats?.singles.matchesPlayed ?? 0 }}</b></span>
          <span class="stat">Won: <b>{{ stats?.singles.matchesWon ?? 0 }}</b></span>
          <span class="stat">Lost: <b>{{ stats?.singles.matchesLost ?? 0 }}</b></span>
          <span class="stat">Win rate: <b>{{ formatPct(stats?.singles.winRate) }}</b></span>
        </div>
      </div>

      <div class="card">
        <div class="cardTitle">Doubles Games</div>
        <div v-if="doublesMatches.length === 0" class="empty">No doubles games yet.</div>
        <div v-else class="tableWrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Team 1 Player 1</th>
                <th>Team 1 Player 2</th>
                <th>Score</th>
                <th>Team 2 Player 1</th>
                <th>Team 2 Player 2</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in doublesMatches" :key="m.id">
                <td class="nameCell">{{ getParticipantName(m.teamA?.[0]) }}</td>
                <td class="nameCell">{{ getParticipantName(m.teamA?.[1]) }}</td>
                <td class="scoreCell" :class="{score21: getFinalScore(m, 'A') === 21}">{{ getFinalScore(m, 'A') }}</td>
                <td class="nameCell">{{ getParticipantName(m.teamB?.[0]) }}</td>
                <td class="nameCell">{{ getParticipantName(m.teamB?.[1]) }}</td>
                <td class="scoreCell" :class="{score21: getFinalScore(m, 'B') === 21}">{{ getFinalScore(m, 'B') }}</td>
                <td class="dateCell">{{ formatDate(m.startedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="statsRow">
          <span class="stat">Played: <b>{{ stats?.doubles.matchesPlayed ?? 0 }}</b></span>
          <span class="stat">Won: <b>{{ stats?.doubles.matchesWon ?? 0 }}</b></span>
          <span class="stat">Lost: <b>{{ stats?.doubles.matchesLost ?? 0 }}</b></span>
          <span class="stat">Win rate: <b>{{ formatPct(stats?.doubles.winRate) }}</b></span>
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
      headItems: [
        {text: "Main", ref: "/?page=main", isMainSwitch: false},
        {text: "Products", ref: "/?page=products", isMainSwitch: false},
        {text: "Badminton", ref: "/?page=badminton", isMainSwitch: true},
      ],
      error: "",
      stats: null,
      participantNames: new Map(),
    };
  },
  computed: {
    singlesMatches() {
      return (this.stats?.recentMatches || []).filter(m => m.kind === 'singles');
    },
    doublesMatches() {
      return (this.stats?.recentMatches || []).filter(m => m.kind === 'doubles');
    },
  },
  async mounted() {
    await this.load();
  },
  methods: {
    async load() {
      this.error = "";
      try {
        await this.loadParticipantNames();
        this.stats = await badmintonClient.getMyGamesStats();
      } catch (e) {
        this.error = e?.message || "Failed to load games stats";
      }
    },
    formatPct(x) {
      if (typeof x !== "number") return "—";
      return `${(x * 100).toFixed(1)}%`;
    },
    formatScore(score) {
      const games = score?.games || [];
      return games.map(g => `${g.pointsA}-${g.pointsB}`).join(", ");
    },
    getParticipantName(participantId) {
      if (!participantId) return "—";
      return this.participantNames.get(participantId) || participantId;
    },
    getFinalScore(match, side) {
      const games = match.score?.games || [];
      if (games.length === 0) return "—";
      // Return points from the last game
      const lastGame = games[games.length - 1];
      return side === 'A' ? lastGame.pointsA : lastGame.pointsB;
    },
    formatDate(dateStr) {
      if (!dateStr) return "—";
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch {
        return dateStr;
      }
    },
    async loadParticipantNames() {
      // Load all participant names from all groups
      try {
        const groups = await badmintonClient.getMyGroups();
        const allParticipants = [];
        for (const g of groups) {
          const parts = await badmintonClient.listParticipants(g.id);
          allParticipants.push(...parts);
        }
        this.participantNames = new Map(allParticipants.map(p => [p.id, p.name]));
      } catch (e) {
        console.warn("Failed to load participant names", e);
      }
    },
    async logout() {
      await badmintonClient.logout();
      this.$router.replace("/?page=badminton");
    },
  },
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Mali&display=swap');

.page { display: flex; flex-direction: column; gap: 64px; }
.content { padding: 0 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; }
.topRow { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.topActions { display: flex; gap: 12px; flex-wrap: wrap; }
.title { margin: 0; font-family: 'Mali','sans-serif'; font-size: 40px; font-weight: 700; }
.linkBtn { text-decoration: none; font-family: 'Mali','sans-serif'; font-weight: 700; color: #4F3DFF; }
.logoutBtn { background: none; border: none; cursor: pointer; padding: 0; font-family: 'Mali','sans-serif'; font-weight: 700; color: #4F3DFF; }

.card { background: white; border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.cardTitle { font-family: 'Mali','sans-serif'; font-weight: 700; font-size: 20px; color: #4F3DFF; }
.empty { font-family: 'Mali','sans-serif'; opacity: 0.7; padding: 20px; text-align: center; }
.statsRow { display: flex; gap: 20px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.stat { font-family: 'Mali','sans-serif'; font-size: 14px; }
.stat b { color: #4F3DFF; font-weight: 700; }

.tableWrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-family: 'Mali','sans-serif'; }
.table thead { background: #f6f6ff; }
.table th { padding: 14px 12px; text-align: left; font-weight: 700; font-size: 15px; color: #4F3DFF; border-bottom: 2px solid #e0e0ff; white-space: nowrap; }
.table td { padding: 12px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.table tbody tr:hover { background: #fafaff; }
.table tbody tr:last-child td { border-bottom: none; }
.nameCell { font-weight: 600; }
.scoreCell { font-weight: 700; color: #4F3DFF; text-align: center; }
.scoreCell.score21 { background-color: #ffeb3b; color: #333; border-radius: 4px; }
.dateCell { font-size: 13px; opacity: 0.8; white-space: nowrap; }

.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: 'Mali','sans-serif'; }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 0 20px 20px 20px; }
  .title { font-size: 28px; }
  .card { padding: 16px; }
  .table th, .table td { padding: 10px 8px; font-size: 13px; }
  .statsRow { gap: 12px; }
}
</style>


