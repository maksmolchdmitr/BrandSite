<template>
  <div class="page">
    <div class="content">
      <div class="topRow">
        <h1 class="title">{{ $t('badminton.ratings.title') }}</h1>
      </div>

      <BadmintonHubCtaRow current="ratings" :disabled="loading" @logout="handleLogout" />

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
                <td class="nameCell">
                  <PersonChip
                    :name="([me?.firstName, me?.lastName].filter(Boolean).join(' ') || me?.username || me?.id || $t('common.misc.noData'))"
                    :photo-url="me?.photoUrl"
                    :photo-crop="me?.photoCrop"
                    :username="me?.username"
                  />
                </td>
                <td class="eloCell">{{ formatElo(ratings?.singlesElo) ?? $t('common.misc.noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="cardTitle">{{ $t('badminton.ratings.historyTitle') }}</div>
        <p class="hint">{{ historyWindowLabel }}</p>
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
            :disabled="historyLoading"
            @click="goPrevHistory"
          >
            ←
          </button>
          <span class="pagerPage">{{ historyWindowLabel }}</span>
          <button
            class="pagerButton"
            :disabled="!canGoNextHistory || historyLoading"
            @click="goNextHistory"
          >
            →
          </button>
        </div>
        <div v-if="historyError" class="errorBox">{{ historyError }}</div>
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
                  <th>{{ $t('badminton.ratings.elo') }}</th>
                  <th>{{ $t('badminton.ratings.games') }}</th>
                  <th>{{ $t('badminton.ratings.wins') }}</th>
                  <th>{{ $t('badminton.ratings.losses') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in currentDoublesPage.items" :key="r.partnerUserId">
                  <td class="nameCell">
                    <PersonChip :name="r.partnerName" :photo-url="r.partnerPhotoUrl" :username="r.partnerUsername" />
                  </td>
                  <td class="eloCell">{{ formatElo(r.elo) }}</td>
                  <td>{{ r.games }}</td>
                  <td>{{ r.wins }}</td>
                  <td>{{ r.losses }}</td>
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
import PersonChip from "@/components/badminton/PersonChip.vue";
import BadmintonHubCtaRow from "@/components/badminton/BadmintonHubCtaRow.vue";
import RatingHistoryChart from "@/components/badminton/RatingHistoryChart.vue";
import {badmintonClient} from "@/badminton/client.js";
import { formatElo } from "@/badminton/formatElo.js";
import { SINGLES_RATING_HISTORY_SAFETY_CAP } from "@/badminton/ratingHistory.js";

const HISTORY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function toIso(date) {
  return new Date(date).toISOString();
}

export default defineComponent({
  components: {PersonChip, BadmintonHubCtaRow, RatingHistoryChart},
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
      historyPoints: [],
      historyStartTime: null,
      historyEndTime: null,
      historyLoading: false,
      historyError: "",
    };
  },
  computed: {
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
    await this.load();
  },
  methods: {
    formatElo,
    resetHistoryWindow() {
      const now = Date.now();
      this.historyEndTime = null;
      this.historyStartTime = toIso(now - HISTORY_WINDOW_MS);
    },
    async loadHistory() {
      if (!this.historyStartTime) {
        this.resetHistoryWindow();
      }
      this.historyLoading = true;
      this.historyError = "";
      try {
        const page = await badmintonClient.listMySinglesRatingHistory({
          startTime: this.historyStartTime,
          endTime: this.historyEndTime || undefined,
        });
        this.historyPoints = page?.items || [];
      } catch (e) {
        this.historyError = e?.message || this.$t("badminton.ratings.historyErrLoad");
        this.historyPoints = [];
      } finally {
        this.historyLoading = false;
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
        this.resetHistoryWindow();
        await this.loadHistory();
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
.page { display: flex; flex-direction: column; gap: 64px; max-width: 100%; box-sizing: border-box; }
.content { padding: 24px 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; box-sizing: border-box; min-width: 0; }
.topRow { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.topActions { display: flex; gap: 12px; flex-wrap: wrap; }
.title { margin: 0; font-family: var(--font-display); font-size: 40px; font-weight: 700; }
.linkBtn { text-decoration: none; font-family: var(--font-display); font-weight: 700; color: #4F3DFF; }
.logoutBtn { background: none; border: none; cursor: pointer; padding: 0; font-family: var(--font-display); font-weight: 700; color: #4F3DFF; }

.card { background: white; border-radius: 18px; padding: 20px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; min-width: 0; box-sizing: border-box; }
.cardTitle { font-family: var(--font-display); font-weight: 700; font-size: 20px; color: #4F3DFF; }
.hint { font-family: var(--font-display); font-size: 13px; opacity: 0.7; margin-top: 8px; }
.empty { font-family: var(--font-display); opacity: 0.7; padding: 20px; text-align: center; }

.tableWrapper { overflow-x: auto; max-width: 100%; min-width: 0; }
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

.pagerLimit {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
  min-width: 0;
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
.warnBox { background: #fff7e6; border: 1px solid #ffd699; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); color: #7a5200; }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 16px 20px 20px 20px; }
  .title { font-size: 28px; }
  .card { padding: 16px; }
  .table th, .table td { padding: 10px 12px; font-size: 14px; }
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

  .warnBox {
    background: #3d3218;
    border-color: #8a6a2a;
    color: #ffe6b0;
  }
}
</style>


