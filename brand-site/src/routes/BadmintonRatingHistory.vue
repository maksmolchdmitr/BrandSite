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
          <div>
            <div class="cardTitle">{{ $t('badminton.ratings.historyChartTitle') }}</div>
            <p class="hint">{{ historyWindowLabel }}</p>
          </div>
          <div class="headerActions">
            <div class="periodRow" role="group" :aria-label="$t('badminton.ratings.historyPeriod')">
              <button
                v-for="opt in periodOptions"
                :key="opt.id"
                type="button"
                class="periodBtn"
                :class="{ active: historyPeriod === opt.id }"
                :disabled="loading"
                @click="setHistoryPeriod(opt.id)"
              >{{ opt.id }}</button>
            </div>
            <button class="btn secondary small" :disabled="loading" @click="loadHistory">
              <LoadingPhrase v-if="loading" :text="$t('common.actions.loading')" />
              <template v-else>{{ $t('common.actions.refresh') }}</template>
            </button>
          </div>
        </div>

        <div v-if="stats" class="statsRow">
          <div class="stat">
            <div class="statLabel">{{ $t('badminton.ratings.historyCurrent') }}</div>
            <div class="statValue">{{ formatElo(stats.current) }}</div>
          </div>
          <div class="stat">
            <div class="statLabel">{{ $t('badminton.ratings.historyDelta') }}</div>
            <div
              class="statValue"
              :class="{ up: stats.delta > 0, down: stats.delta < 0 }"
            >
              {{ stats.delta > 0 ? '+' : '' }}{{ formatElo(stats.delta) }}
            </div>
          </div>
          <div class="stat">
            <div class="statLabel">{{ $t('badminton.ratings.historyPoints') }}</div>
            <div class="statValue muted">{{ historyPoints.length }}</div>
          </div>
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
import { formatElo } from "@/badminton/formatElo.js";
import { SINGLES_RATING_HISTORY_SAFETY_CAP } from "@/badminton/ratingHistory.js";
import { redirectToLoginAutoTg } from "@/badminton/apiHelpers.js";
import {
  getRatingHistoryPeriod,
  setRatingHistoryPeriod,
} from "@/badminton/uiPrefs.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const PERIOD_OPTIONS = [
  { id: "1d", ms: 1 * DAY_MS },
  { id: "1w", ms: 7 * DAY_MS },
  { id: "1m", ms: 30 * DAY_MS },
  { id: "1y", ms: 365 * DAY_MS },
];

function toIso(date) {
  return new Date(date).toISOString();
}

function isRated(point) {
  return point != null && point.elo != null && Number.isFinite(Number(point.elo));
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
      historyPeriod: getRatingHistoryPeriod(),
      periodOptions: PERIOD_OPTIONS,
    };
  },
  computed: {
    historyWindowMs() {
      return PERIOD_OPTIONS.find((opt) => opt.id === this.historyPeriod)?.ms || PERIOD_OPTIONS[2].ms;
    },
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
    stats() {
      const rated = (this.historyPoints || []).filter(isRated);
      if (!rated.length) return null;
      const first = Number(rated[0].elo);
      const current = Number(rated[rated.length - 1].elo);
      return {
        current,
        delta: current - first,
      };
    },
  },
  async mounted() {
    if (redirectToLoginAutoTg(this.$router)) return;
    this.resetHistoryWindow();
    await this.loadHistory();
  },
  methods: {
    formatElo,
    resetHistoryWindow() {
      const now = Date.now();
      this.historyEndTime = null;
      this.historyStartTime = toIso(now - this.historyWindowMs);
    },
    async setHistoryPeriod(periodId) {
      if (this.historyPeriod === periodId) return;
      this.historyPeriod = setRatingHistoryPeriod(periodId);
      this.resetHistoryWindow();
      await this.loadHistory();
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
      this.historyStartTime = toIso(oldStart - this.historyWindowMs);
      await this.loadHistory();
    },
    async goNextHistory() {
      if (!this.historyEndTime) return;
      const oldEnd = new Date(this.historyEndTime).getTime();
      const now = Date.now();
      this.historyStartTime = this.historyEndTime;
      if (oldEnd + this.historyWindowMs >= now) {
        this.historyEndTime = null;
      } else {
        this.historyEndTime = toIso(oldEnd + this.historyWindowMs);
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
.page { display: flex; flex-direction: column; gap: 24px; max-width: 100%; box-sizing: border-box; }
.content { padding: 24px 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; box-sizing: border-box; min-width: 0; }
.topRow { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.title { margin: 0; font-family: var(--font-display); font-size: 40px; font-weight: 700; }

.card {
  background: white;
  border-radius: 18px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid rgba(79, 61, 255, 0.08);
  overflow: hidden;
}
.cardHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
}
.headerActions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 0;
}
.periodRow {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 4px;
  border-radius: 999px;
  background: #f3f1ff;
  border: 1px solid rgba(79, 61, 255, 0.12);
}
.periodBtn {
  border: none;
  cursor: pointer;
  background: transparent;
  color: #4F3DFF;
  border-radius: 999px;
  padding: 8px 12px;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
}
.periodBtn.active {
  background: #4F3DFF;
  color: white;
}
.periodBtn:disabled {
  opacity: 0.7;
  cursor: default;
}
.cardTitle {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 20px;
  color: #4F3DFF;
  margin: 0 0 4px 0;
}
.hint {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  opacity: 0.65;
  margin: 0;
}

.statsRow {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.stat {
  background: linear-gradient(180deg, #f7f6ff 0%, #f3f1ff 100%);
  border: 1px solid rgba(79, 61, 255, 0.12);
  border-radius: 14px;
  padding: 14px 16px;
  min-width: 0;
}
.statLabel {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  color: #7a76a8;
  margin-bottom: 6px;
}
.statValue {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: #4F3DFF;
  line-height: 1.1;
  overflow-wrap: anywhere;
}
.statValue.muted { color: #2a2a3a; }
.statValue.up { color: #1f9d57; }
.statValue.down { color: #d64545; }

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
  flex-wrap: wrap;
  max-width: 100%;
  min-width: 0;
  padding-top: 4px;
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
  font-size: 15px;
  font-weight: 600;
  color: #4a4868;
}

.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }
.warnBox { background: #fff7e6; border: 1px solid #ffd699; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); color: #7a5200; }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 16px 20px 20px 20px; }
  .title { font-size: 28px; }
  .card { padding: 16px; }
  .statsRow { grid-template-columns: 1fr; }
  .statValue { font-size: 24px; }
}

@media (prefers-color-scheme: dark) {
  .title { color: #e8e8e8; }

  .card {
    background: #2d2d2d;
    border-color: #3b3b3b;
  }

  .stat {
    background: linear-gradient(180deg, #34323f 0%, #2f2d39 100%);
    border-color: #4a4860;
  }

  .statValue.muted { color: #e8e8e8; }

  .pagerButton,
  .btn.secondary {
    background-color: #2d2d2d;
  }

  .periodRow {
    background: #34323f;
    border-color: #4a4860;
  }

  .periodBtn {
    color: #c7bcff;
  }

  .periodBtn.active {
    background: #4F3DFF;
    color: white;
  }

  .pagerPage { color: #c7c4de; }

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
