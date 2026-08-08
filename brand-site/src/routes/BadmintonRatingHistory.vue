<template>
  <div class="page">
    <div class="content">
      <div class="topRow">
        <h1 class="title">{{ $t('badminton.ratings.historyTitle') }}</h1>
      </div>

      <BadmintonHubCtaRow current="rating-history" :disabled="loading" @logout="handleLogout" />

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div class="card">
        <div class="cardHeader">
          <p class="hint">{{ historyWindowLabel }}</p>
          <button class="btn secondary small" :disabled="loading" @click="loadHistory">
            <LoadingPhrase v-if="loading" :text="$t('common.actions.loading')" />
            <template v-else>{{ $t('common.actions.refresh') }}</template>
          </button>
        </div>
        <div v-if="historyTruncated" class="warnBox">
          {{ $t('badminton.ratings.historyTruncated', { max: historySafetyCap }) }}
        </div>
        <RatingHistoryChart
          :points="historyPoints"
          :empty-text="$t('badminton.ratings.historyEmpty')"
          :pending-label="$t('badminton.ratings.historyPending')"
        />
        <div class="pagerRow">
          <button
            class="pagerButton"
            :disabled="loading"
            @click="goPrevHistory"
          >
            ←
          </button>
          <span class="pagerPage">{{ historyWindowLabel }}</span>
          <button
            class="pagerButton"
            :disabled="!canGoNextHistory || loading"
            @click="goNextHistory"
          >
            →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import BadmintonHubCtaRow from "@/components/badminton/BadmintonHubCtaRow.vue";
import RatingHistoryChart from "@/components/badminton/RatingHistoryChart.vue";
import LoadingPhrase from "@/components/LoadingPhrase.vue";
import { badmintonClient } from "@/badminton/client.js";
import { SINGLES_RATING_HISTORY_SAFETY_CAP } from "@/badminton/ratingHistory.js";

const HISTORY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function toIso(date) {
  return new Date(date).toISOString();
}

export default defineComponent({
  components: { BadmintonHubCtaRow, RatingHistoryChart, LoadingPhrase },
  data() {
    return {
      loading: false,
      error: "",
      historyPoints: [],
      historyStartTime: null,
      historyEndTime: null,
    };
  },
  computed: {
    canGoNextHistory() {
      return !!this.historyEndTime;
    },
    historySafetyCap() {
      return SINGLES_RATING_HISTORY_SAFETY_CAP;
    },
    historyTruncated() {
      return this.historyPoints.length >= SINGLES_RATING_HISTORY_SAFETY_CAP;
    },
    historyWindowLabel() {
      if (!this.historyStartTime) return "";
      const locale = this.$i18n?.locale === "en" ? "en-GB" : "ru-RU";
      const from = new Date(this.historyStartTime).toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const to = this.historyEndTime
        ? new Date(this.historyEndTime).toLocaleDateString(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : this.$t("badminton.ratings.historyNow");
      return this.$t("badminton.ratings.historyWindow", { from, to });
    },
  },
  async mounted() {
    this.resetHistoryWindow();
    await this.loadHistory();
  },
  methods: {
    resetHistoryWindow() {
      const now = Date.now();
      this.historyEndTime = null;
      this.historyStartTime = toIso(now - HISTORY_WINDOW_MS);
    },
    async loadHistory() {
      if (!this.historyStartTime) {
        this.resetHistoryWindow();
      }
      this.loading = true;
      this.error = "";
      try {
        const page = await badmintonClient.listMySinglesRatingHistory({
          startTime: this.historyStartTime,
          endTime: this.historyEndTime || undefined,
        });
        this.historyPoints = page?.items || [];
      } catch (e) {
        this.error = e?.message || this.$t("badminton.ratings.historyErrLoad");
        this.historyPoints = [];
      } finally {
        this.loading = false;
      }
    },
    async goPrevHistory() {
      if (!this.historyStartTime) return;
      const oldStart = new Date(this.historyStartTime).getTime();
      this.historyEndTime = this.historyStartTime;
      this.historyStartTime = toIso(oldStart - HISTORY_WINDOW_MS);
      await this.loadHistory();
    },
    async goNextHistory() {
      if (!this.historyEndTime) return;
      const oldEnd = new Date(this.historyEndTime).getTime();
      const now = Date.now();
      this.historyStartTime = this.historyEndTime;
      if (oldEnd + HISTORY_WINDOW_MS >= now) {
        this.historyEndTime = null;
      } else {
        this.historyEndTime = toIso(oldEnd + HISTORY_WINDOW_MS);
      }
      await this.loadHistory();
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
.page { display: flex; flex-direction: column; gap: 64px; max-width: 100%; box-sizing: border-box; }
.content { padding: 24px 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; box-sizing: border-box; min-width: 0; }
.topRow { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.title { margin: 0; font-family: var(--font-display); font-size: 40px; font-weight: 700; }

.card { background: white; border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; min-width: 0; box-sizing: border-box; }
.cardHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.hint { font-family: var(--font-display); font-size: 14px; font-weight: 600; opacity: 0.75; margin: 0; }

.btn {
  flex: 0 0 auto;
  border: none;
  cursor: pointer;
  background-color: #4F3DFF;
  color: white;
  border-radius: 100px;
  padding: 10px 14px;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
}
.btn.secondary { background: white; color: #4F3DFF; border: 2px solid #4F3DFF; }
.btn.small { padding: 8px 12px; font-size: 13px; }
.btn:disabled { opacity: 0.7; cursor: default; }

.pagerRow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
  max-width: 100%;
  min-width: 0;
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

.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }
.warnBox { background: #fff7e6; border: 1px solid #ffd699; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); color: #7a5200; }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 16px 20px 20px 20px; }
  .title { font-size: 28px; }
  .card { padding: 16px; }
}

@media (prefers-color-scheme: dark) {
  .card {
    background: #2d2d2d;
    border: 1px solid #3b3b3b;
  }

  .pagerButton {
    background-color: #2d2d2d;
  }

  .btn.secondary {
    background-color: #2d2d2d;
  }

  .errorBox {
    background: #4a1f1f;
    border-color: #8e3c3c;
    color: #ffd6d6;
  }

  .warnBox {
    background: #3d3218;
    border-color: #8a6a2a;
    color: #ffe6b0;
  }
}
</style>
