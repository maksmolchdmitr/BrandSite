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
    // Когда пользователь возвращается с oauth.telegram.org, Telegram редиректит на origin (корень сайта).
    // Параметры приходят в hash или query — перенаправляем на страницу логина, чтобы их обработать.
    this.redirectToLoginIfTelegramCallback();

    // Redirect /?page=badminton to ratings for logged in users, or login for not logged in
    if (this.page === 'badminton' && !this.section) {
      const {getLoggedInUserId} = await import("@/badminton/cookies.js");
      const userId = getLoggedInUserId();
      if (userId && userId.trim() !== '') {
        await this.router.replace('/?page=badminton&section=ratings');
      } else {
        await this.router.replace('/?page=badminton&section=login');
      }
    }
  },
  methods: {
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
      if (!onLogin && (fromHash() || fromQuery())) {
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
      // Badminton service routing
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
        } else if (this.section === 'games') {
          return markRaw(BadmintonGames);
        }
        // If no section and not redirected, show login (shouldn't happen due to mounted redirect)
        return markRaw(BadmintonLogin);
      }
      
      // Main pages routing
      if (this.page === 'contact') {
        return markRaw(TouchMe);
      } else if (this.page === 'products') {
        return markRaw(Products);
      }
      
      // Default to Main
      return markRaw(Main);
    },
    componentProps() {
      const props = {};
      
      // Pass groupId to BadmintonGroup component
      if (this.page === 'badminton' && this.section === 'groups' && this.groupId) {
        props.groupId = this.groupId;
      }
      
      // Pass userId for badminton login
      if (this.page === 'badminton' && this.userId) {
        props.userId = this.userId;
      }
      
      return props;
    }
  }
});
</script>

