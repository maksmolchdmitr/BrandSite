<template>
  <component :is="currentComponent" v-bind="componentProps"/>
</template>

<script>
import {defineComponent, markRaw} from "vue";
import {useRoute, useRouter} from "vue-router";
import Main from "@/routes/Main.vue";
import TouchMe from "@/routes/TouchMe.vue";
import Products from "@/routes/Products.vue";
import BadmintonLogin from "@/routes/BadmintonLogin.vue";
import BadmintonGroups from "@/routes/BadmintonGroups.vue";
import BadmintonGroup from "@/routes/BadmintonGroup.vue";
import BadmintonRatings from "@/routes/BadmintonRatings.vue";
import BadmintonRatingHistory from "@/routes/BadmintonRatingHistory.vue";
import BadmintonDoublesRatingHistory from "@/routes/BadmintonDoublesRatingHistory.vue";
import BadmintonGames from "@/routes/BadmintonGames.vue";
import BadmintonProfile from "@/routes/BadmintonProfile.vue";
import {
  getGamesTab,
  getGroupMatchTab,
  getGroupSection,
  setGamesTab,
  setGroupMatchTab,
  setGroupSection,
} from "@/badminton/uiPrefs.js";

export default defineComponent({
  setup() {
    const route = useRoute();
    const router = useRouter();
    return { route, router };
  },
  async mounted() {
    this.redirectToLoginIfTelegramCallback();

    await this.maybeRedirectBadmintonToSection();
    this.redirectLegacyBadmintonGamesSection();
    this.normalizeBadmintonGamesSection();
    this.normalizeBadmintonGroupSection();
    this.rememberBadmintonUiPrefs();
    this.applyDocumentChrome();
  },
  watch: {
    "$route": {
      handler() {
        this.redirectToLoginIfTelegramCallback();
        this.maybeRedirectBadmintonToSection();
        this.redirectLegacyBadmintonGamesSection();
        this.normalizeBadmintonGamesSection();
        this.normalizeBadmintonGroupSection();
        this.rememberBadmintonUiPrefs();
        this.applyDocumentChrome();
      },
    },
  },
  methods: {
    applyDocumentChrome() {
      if (typeof document === "undefined") return;
      const isBadminton = this.page === "badminton";
      document.title = isBadminton ? "badminton-service" : "MaksMolch site";
      let icon = document.querySelector("link[rel='icon']");
      if (!icon) {
        icon = document.createElement("link");
        icon.rel = "icon";
        document.head.appendChild(icon);
      }
      icon.type = "image/png";
      icon.href = isBadminton
        ? "/badminton-service-favicon.png"
        : "/favicon.ico";
    },
    rememberBadmintonUiPrefs() {
      if (this.page !== "badminton") return;
      if (this.section === "games") {
        const tab = this.route.query.tab;
        if (tab === "singles" || tab === "doubles") setGamesTab(tab);
      }
      if (this.section === "groups" && this.groupId) {
        const mt = this.route.query.matchTab;
        if (mt === "singles" || mt === "doubles") setGroupMatchTab(mt);
        const gs = this.route.query.groupSection;
        if (gs === "matches" || gs === "participants" || gs === "leaderboards") {
          setGroupSection(gs);
        }
      }
    },
    /** games-singles / games-doubles → section=games&tab=… */
    redirectLegacyBadmintonGamesSection() {
      if (this.page !== "badminton") return;
      if (this.section === "games-singles") {
        this.router.replace({
          query: { ...this.route.query, page: "badminton", section: "games", tab: "singles" },
        });
      } else if (this.section === "games-doubles") {
        this.router.replace({
          query: { ...this.route.query, page: "badminton", section: "games", tab: "doubles" },
        });
      }
    },
    /** section=games без tab → last remembered tab */
    normalizeBadmintonGamesSection() {
      if (this.page !== "badminton" || this.section !== "games") return;
      const tab = this.route.query.tab;
      if (tab === "singles" || tab === "doubles") return;
      this.router.replace({
        query: { ...this.route.query, page: "badminton", section: "games", tab: getGamesTab() },
      });
    },
    /** group without groupSection / matchTab → remembered defaults */
    normalizeBadmintonGroupSection() {
      if (this.page !== "badminton" || this.section !== "groups" || !this.groupId) return;
      const q = this.route.query;
      const patch = {};
      const gs = q.groupSection;
      if (!gs) {
        patch.groupSection = getGroupSection();
      }
      const section = gs || patch.groupSection;
      if (
        section === "matches"
        || section === "leaderboards"
        || section === "createMatch"
        || section === "editMatch"
      ) {
        const mt = String(q.matchTab || "").toLowerCase();
        if (mt !== "singles" && mt !== "doubles") {
          patch.matchTab = getGroupMatchTab();
        }
      }
      if (Object.keys(patch).length === 0) return;
      this.router.replace({
        query: { ...q, page: "badminton", section: "groups", groupId: this.groupId, ...patch },
      });
    },
    async maybeRedirectBadmintonToSection() {
      if (this.page !== "badminton" || this.section) return;
      const { getLoggedInUserId } = await import("@/badminton/cookies.js");
      const { hasAuth } = await import("@/badminton/apiHelpers.js");
      const hasTokens = hasAuth();
      const userId = getLoggedInUserId();
      if (hasTokens || (userId && userId.trim() !== "")) {
        await this.router.replace("/?page=badminton&section=ratings");
      } else {
        await this.router.replace("/?page=badminton&section=login&autoTg=1");
      }
    },
    redirectToLoginIfTelegramCallback() {
      if (typeof window === 'undefined') return;
      const telegramParams = ['id', 'first_name', 'auth_date', 'hash'];
      const fromHash = () => {
        const h = window.location.hash.replace(/^#/, '');
        if (!h) return false;
        const p = new URLSearchParams(h);
        if (p.has('tgAuthResult')) return true;
        return telegramParams.filter((k) => p.has(k)).length >= 3;
      };
      const fromQuery = () => {
        const q = this.route?.query || {};
        return telegramParams.filter((k) => q[k] != null).length >= 3;
      };
      const onLogin = this.page === 'badminton' && this.section === 'login';
      const hasCallback = fromHash() || fromQuery();
      if (!onLogin && hasCallback) {
        const hash = window.location.hash || '';
        const search = (window.location.search || '').replace(/^\?/, '');
        const loginQuery = 'page=badminton&section=login' + (search ? '&' + search : '');
        this.router.replace('/?' + loginQuery + hash);
      }
    },
  },
  computed: {
    page() {
      return this.route.query.page || 'main';
    },
    section() {
      return this.route.query.section || null;
    },
    groupId() {
      return this.route.query.groupId || null;
    },
    userId() {
      return this.route.query.userId || null;
    },
    currentComponent() {
      if (this.page === 'badminton') {
        if (this.section === 'login') {
          return markRaw(BadmintonLogin);
        } else if (this.section === 'groups') {
          if (this.groupId) {
            return markRaw(BadmintonGroup);
          }
          return markRaw(BadmintonGroups);
        } else if (this.section === 'ratings') {
          return markRaw(BadmintonRatings);
        } else if (this.section === 'rating-history') {
          return markRaw(BadmintonRatingHistory);
        } else if (this.section === 'doubles-rating-history') {
          return markRaw(BadmintonDoublesRatingHistory);
        } else if (this.section === 'profile') {
          return markRaw(BadmintonProfile);
        } else if (this.section === "games") {
          return markRaw(BadmintonGames);
        }
        return markRaw(BadmintonLogin);
      }

      if (this.page === 'contact') {
        return markRaw(TouchMe);
      } else if (this.page === 'products') {
        return markRaw(Products);
      }

      return markRaw(Main);
    },
    componentProps() {
      const props = {};
      if (this.page === 'badminton' && this.section === 'groups' && this.groupId) {
        props.groupId = this.groupId;
        props.groupSection = this.route?.query?.groupSection || getGroupSection();
        const mt = this.route?.query?.matchTab;
        props.matchTab = mt === "singles" || mt === "doubles" ? mt : getGroupMatchTab();
        props.participantId = this.route?.query?.participantId || null;
        props.matchId = this.route?.query?.matchId || null;
      }
      if (this.page === 'badminton' && this.section === 'games') {
        const tab = this.route?.query?.tab;
        props.gamesTab = tab === "doubles" || tab === "singles" ? tab : getGamesTab();
      }
      if (this.page === 'badminton' && this.userId) {
        props.userId = this.userId;
      }
      return props;
    }
  }
});
</script>
