<template>
  <div class="page">
    <div class="content">
      <div class="topRow">
        <div>
          <h1 class="title">{{ $t("badminton.linkUserMatches.title") }}</h1>
          <p class="subtitle">{{ $t("badminton.linkUserMatches.subtitle") }}</p>
        </div>
        <BadmintonTopActions />
      </div>

      <router-link class="backLink" :to="notificationsTo">
        {{ $t("badminton.linkUserMatches.backToNotifications") }}
      </router-link>

      <div v-if="error" class="errorBox">{{ error }}</div>

      <BadmintonPillNav :items="tabItems" aria-label="link user matches kind" />

      <div class="card">
        <div v-if="loading && currentItems.length === 0" class="empty">
          <LoadingPhrase :text="$t('common.actions.loading')" />
        </div>
        <div v-else-if="currentItems.length === 0" class="empty">
          {{ $t("badminton.linkUserMatches.empty") }}
        </div>
        <div v-else-if="tab === 'singles'" class="tableWrapper">
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
                <td class="nameCell">
                  <PersonChip
                    :name="getParticipantName(m.teamA?.[0])"
                    :photo-url="getParticipantPhoto(m.teamA?.[0])"
                    :photo-crop="getParticipantCrop(m.teamA?.[0])"
                    :username="getParticipantUsername(m.teamA?.[0])"
                  />
                </td>
                <td class="scoreCell">{{ getFinalScore(m, "A") }}</td>
                <td class="nameCell">
                  <PersonChip
                    :name="getParticipantName(m.teamB?.[0])"
                    :photo-url="getParticipantPhoto(m.teamB?.[0])"
                    :photo-crop="getParticipantCrop(m.teamB?.[0])"
                    :username="getParticipantUsername(m.teamB?.[0])"
                  />
                </td>
                <td class="scoreCell">{{ getFinalScore(m, "B") }}</td>
                <td class="dateCell">{{ formatDate(m.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="tableWrapper">
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
                <td class="nameCell">
                  <PersonChip
                    :name="getParticipantName(m.teamA?.[0])"
                    :photo-url="getParticipantPhoto(m.teamA?.[0])"
                    :photo-crop="getParticipantCrop(m.teamA?.[0])"
                    :username="getParticipantUsername(m.teamA?.[0])"
                  />
                </td>
                <td class="nameCell">
                  <PersonChip
                    :name="getParticipantName(m.teamA?.[1])"
                    :photo-url="getParticipantPhoto(m.teamA?.[1])"
                    :photo-crop="getParticipantCrop(m.teamA?.[1])"
                    :username="getParticipantUsername(m.teamA?.[1])"
                  />
                </td>
                <td class="scoreCell">{{ getFinalScore(m, "A") }}</td>
                <td class="nameCell">
                  <PersonChip
                    :name="getParticipantName(m.teamB?.[0])"
                    :photo-url="getParticipantPhoto(m.teamB?.[0])"
                    :photo-crop="getParticipantCrop(m.teamB?.[0])"
                    :username="getParticipantUsername(m.teamB?.[0])"
                  />
                </td>
                <td class="nameCell">
                  <PersonChip
                    :name="getParticipantName(m.teamB?.[1])"
                    :photo-url="getParticipantPhoto(m.teamB?.[1])"
                    :photo-crop="getParticipantCrop(m.teamB?.[1])"
                    :username="getParticipantUsername(m.teamB?.[1])"
                  />
                </td>
                <td class="scoreCell">{{ getFinalScore(m, "B") }}</td>
                <td class="dateCell">{{ formatDate(m.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          v-if="pageToken"
          class="btn secondary"
          :disabled="loadingMore"
          @click="loadMore"
        >
          <LoadingPhrase v-if="loadingMore" :text="$t('common.actions.loading')" />
          <template v-else>{{ $t("badminton.notifications.loadMore") }}</template>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import BadmintonPillNav from "@/components/badminton/BadmintonPillNav.vue";
import BadmintonTopActions from "@/components/badminton/BadmintonTopActions.vue";
import LoadingPhrase from "@/components/LoadingPhrase.vue";
import PersonChip from "@/components/badminton/PersonChip.vue";
import {badmintonClient} from "@/badminton/client.js";
import {redirectToLoginAutoTg} from "@/badminton/apiHelpers.js";
import {matchFormatMixin} from "@/routes/badminton/matchFormatMixin.js";

const PAGE_SIZE = 20;

export default defineComponent({
  name: "BadmintonLinkUserMatches",
  components: {BadmintonPillNav, BadmintonTopActions, LoadingPhrase, PersonChip},
  mixins: [matchFormatMixin],
  data() {
    return {
      tab: "singles",
      loading: false,
      loadingMore: false,
      error: "",
      singlesItems: [],
      doublesItems: [],
      singlesPageToken: null,
      doublesPageToken: null,
    };
  },
  computed: {
    notificationId() {
      return this.$route.query.notificationId || "";
    },
    groupId() {
      return this.$route.query.groupId || "";
    },
    notificationsTo() {
      return "/?page=badminton&section=notifications";
    },
    tabItems() {
      const mk = (tab) => {
        const q = new URLSearchParams({
          page: "badminton",
          section: "link-user-matches",
          notificationId: this.notificationId,
          tab,
        });
        if (this.groupId) q.set("groupId", this.groupId);
        return `/?${q.toString()}`;
      };
      return [
        {
          to: mk("singles"),
          label: this.$t("badminton.groups.mySinglesMatches"),
          active: this.tab === "singles",
        },
        {
          to: mk("doubles"),
          label: this.$t("badminton.groups.myDoublesMatches"),
          active: this.tab === "doubles",
        },
      ];
    },
    currentItems() {
      return this.tab === "singles" ? this.singlesItems : this.doublesItems;
    },
    pageToken() {
      return this.tab === "singles" ? this.singlesPageToken : this.doublesPageToken;
    },
  },
  watch: {
    "$route.query.tab"(value) {
      this.tab = value === "doubles" ? "doubles" : "singles";
      this.ensureLoaded();
    },
    notificationId() {
      this.resetAndLoad();
    },
  },
  async mounted() {
    if (redirectToLoginAutoTg(this.$router)) return;
    this.tab = this.$route.query.tab === "doubles" ? "doubles" : "singles";
    if (!this.notificationId) {
      this.error = this.$t("badminton.linkUserMatches.errMissingNotification");
      return;
    }
    await this.loadParticipantNamesForInvite();
    await this.resetAndLoad();
  },
  methods: {
    async loadParticipantNamesForInvite() {
      if (!this.notificationId) return;
      try {
        const res = await badmintonClient.listAllLinkUserInviteParticipants(this.notificationId);
        const items = res?.items || [];
        this.participantNames = new Map(items.map((p) => [p.id, p.name]));
        this.participantPhotos = new Map(
          items.filter((p) => p.photoUrl).map((p) => [p.id, p.photoUrl])
        );
        this.participantCrops = new Map(
          items.filter((p) => p.photoCrop).map((p) => [p.id, p.photoCrop])
        );
        this.participantUsernames = new Map(
          items.filter((p) => p.username).map((p) => [p.id, p.username])
        );
        for (const p of items) {
          if (p.userId) {
            this.participantNames.set(p.userId, p.name);
            if (p.photoUrl) this.participantPhotos.set(p.userId, p.photoUrl);
            if (p.photoCrop) this.participantCrops.set(p.userId, p.photoCrop);
            if (p.username) this.participantUsernames.set(p.userId, p.username);
          }
        }
      } catch (e) {
        console.warn("Failed to load participants for link-user matches", e);
      }
    },
    async resetAndLoad() {
      this.singlesItems = [];
      this.doublesItems = [];
      this.singlesPageToken = null;
      this.doublesPageToken = null;
      await this.ensureLoaded(true);
    },
    async ensureLoaded(force = false) {
      const kind = this.tab === "doubles" ? "doubles" : "singles";
      const hasItems = kind === "singles" ? this.singlesItems.length > 0 : this.doublesItems.length > 0;
      if (!force && hasItems) return;
      await this.fetchPage(kind, null, false);
    },
    async fetchPage(kind, pageToken, append) {
      if (!this.notificationId) return;
      if (append) this.loadingMore = true;
      else this.loading = true;
      this.error = append ? this.error : "";
      try {
        const page = await badmintonClient.listLinkUserInviteMatches(this.notificationId, {
          kind,
          limit: PAGE_SIZE,
          pageToken,
        });
        const items = page?.items || [];
        if (kind === "singles") {
          this.singlesItems = append ? [...this.singlesItems, ...items] : items;
          this.singlesPageToken = page?.pageToken || null;
        } else {
          this.doublesItems = append ? [...this.doublesItems, ...items] : items;
          this.doublesPageToken = page?.pageToken || null;
        }
      } catch (e) {
        this.error = e?.message || this.$t("badminton.linkUserMatches.errLoad");
        if (!append) {
          if (kind === "singles") this.singlesItems = [];
          else this.doublesItems = [];
        }
      } finally {
        this.loading = false;
        this.loadingMore = false;
      }
    },
    loadMore() {
      if (!this.pageToken || this.loadingMore) return;
      const kind = this.tab === "doubles" ? "doubles" : "singles";
      this.fetchPage(kind, this.pageToken, true);
    },
  },
});
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 64px; max-width: 100%; box-sizing: border-box; }
.content { padding: 24px 50px 50px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; box-sizing: border-box; min-width: 0; }
.topRow { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.title { margin: 0 0 6px; font-family: var(--font-display); font-size: 40px; font-weight: 700; }
.subtitle { margin: 0; font-family: var(--font-display); opacity: 0.75; }
.backLink { font-family: var(--font-display); font-weight: 700; color: #4f3dff; text-decoration: none; align-self: flex-start; }
.backLink:hover { text-decoration: underline; }
.card { background: white; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px; color: #1a1a2e; color-scheme: light; }
.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }
.empty { font-family: var(--font-display); color: #555; }
.tableWrapper { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; font-family: var(--font-display); font-size: 14px; }
.table th, .table td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #eee; vertical-align: middle; }
.scoreCell { font-weight: 700; white-space: nowrap; }
.dateCell { white-space: nowrap; opacity: 0.8; }
.btn { border: none; cursor: pointer; background: #4f3dff; color: white; border-radius: 100px; padding: 12px 16px; font-family: var(--font-display); font-weight: 700; align-self: flex-start; }
.btn.secondary { background: white; color: #4f3dff; border: 2px solid #4f3dff; }
.btn:disabled { opacity: 0.7; cursor: default; }

@media (max-width: 768px) {
  .content { padding: 16px 20px 20px; }
  .title { font-size: 28px; }
}

@media (prefers-color-scheme: dark) {
  .title, .subtitle { color: #e8e8e8; }
  .card { background: #2d2d2d; border: 1px solid #3b3b3b; color: #e8e8e8; color-scheme: dark; }
  .empty { color: #b0b0b0; }
  .backLink { color: #b8a8ff; }
  .table th, .table td { border-bottom-color: #444; }
  .btn.secondary { background: #2d2d2d; }
  .errorBox { background: #4a1f1f; border-color: #8e3c3c; color: #ffd6d6; }
}
</style>
