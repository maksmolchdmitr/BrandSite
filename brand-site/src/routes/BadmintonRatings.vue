<template>
  <div class="page">
    <HeadBar :headItems="headItems"></HeadBar>

    <div class="content">
      <div class="topRow">
        <h1 class="title">My ratings</h1>
        <div class="topActions">
          <RouterLink class="linkBtn" to="/?page=badminton&section=games">My games</RouterLink>
          <RouterLink class="linkBtn" to="/?page=badminton&section=groups">My groups</RouterLink>
        </div>
      </div>

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div class="card">
        <div class="cardTitle">Individual Elo Rating</div>
        <div class="tableWrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Elo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ me?.displayName || me?.username || me?.id || "—" }}</td>
                <td class="eloCell">{{ ratings?.singlesElo ?? "—" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="hint">Formula: base 1200 + wins×8 − losses×6</div>
      </div>

      <div class="card">
        <div class="cardTitle">Doubles Elo by Partner</div>
        <div v-if="(ratings?.doublesByPartner || []).length === 0" class="empty">
          No doubles games yet.
        </div>
        <div v-else class="tableWrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Games</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Elo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in (ratings?.doublesByPartner || [])" :key="r.partnerUserId">
                <td class="nameCell">{{ r.partnerName }}</td>
                <td>{{ r.games }}</td>
                <td>{{ r.wins }}</td>
                <td>{{ r.losses }}</td>
                <td class="eloCell">{{ r.elo }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="hint">Formula per partner: base 1100 + pairWins×10 − pairLosses×7</div>
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
      me: null,
      ratings: null,
    };
  },
  async mounted() {
    await this.load();
  },
  methods: {
    async load() {
      this.error = "";
      try {
        const [me, ratings] = await Promise.all([badmintonClient.getMe(), badmintonClient.getMyRatings()]);
        this.me = me;
        this.ratings = ratings;
      } catch (e) {
        this.error = e?.message || "Failed to load ratings";
      }
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
.hint { font-family: 'Mali','sans-serif'; font-size: 13px; opacity: 0.7; margin-top: 8px; }
.empty { font-family: 'Mali','sans-serif'; opacity: 0.7; padding: 20px; text-align: center; }

.tableWrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-family: 'Mali','sans-serif'; }
.table thead { background: #f6f6ff; }
.table th { padding: 14px 16px; text-align: left; font-weight: 700; font-size: 16px; color: #4F3DFF; border-bottom: 2px solid #e0e0ff; }
.table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 15px; }
.table tbody tr:hover { background: #fafaff; }
.table tbody tr:last-child td { border-bottom: none; }
.nameCell { font-weight: 600; }
.eloCell { font-weight: 700; color: #4F3DFF; font-size: 16px; }

.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: 'Mali','sans-serif'; }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 0 20px 20px 20px; }
  .title { font-size: 28px; }
  .card { padding: 16px; }
  .table th, .table td { padding: 10px 12px; font-size: 14px; }
}
</style>


