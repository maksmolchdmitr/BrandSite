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
import BadmintonGames from "@/routes/BadmintonGames.vue";

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
  },
  watch: {
    "$route": {
      handler() {
        this.redirectToLoginIfTelegramCallback();
        this.maybeRedirectBadmintonToSection();
        this.redirectLegacyBadmintonGamesSection();
        this.normalizeBadmintonGamesSection();
      },
    },
  },
  methods: {
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
    /** section=games без tab → tab=singles */
    normalizeBadmintonGamesSection() {
      if (this.page !== "badminton" || this.section !== "games") return;
      const tab = this.route.query.tab;
      if (tab === "singles" || tab === "doubles") return;
      this.router.replace({
        query: { ...this.route.query, page: "badminton", section: "games", tab: "singles" },
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
        await this.router.replace("/?page=badminton&section=login");
      }
    },
    redirectToLoginIfTelegramCallback() {
      if (typeof window === 'undefined') return;
      const telegramParams = ['id', 'first_name', 'auth_date', 'hash'];
      const fromHash = () => {
        const h = window.location.hash.replace(/^#/, '');
        if (!h) return false;
        const p = new URLSearchParams(h);
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
        props.groupSection = this.route?.query?.groupSection || 'participants';
        const mt = this.route?.query?.matchTab;
        props.matchTab = mt === "doubles" || mt === "singles" ? mt : "singles";
      }
      if (this.page === 'badminton' && this.section === 'games') {
        const tab = this.route?.query?.tab;
        props.gamesTab = tab === "doubles" ? "doubles" : "singles";
      }
      if (this.page === 'badminton' && this.userId) {
        props.userId = this.userId;
      }
      return props;
    }
  }
});
</script>
