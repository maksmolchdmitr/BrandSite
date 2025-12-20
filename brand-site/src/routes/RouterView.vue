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
    console.log('RouterView mounted with query:', this.route.query);
    
    // Redirect /?page=badminton to ratings for logged in users, or login for not logged in
    if (this.page === 'badminton' && !this.section) {
      const {getLoggedInUserId} = await import("@/badminton/cookies.js");
      const userId = getLoggedInUserId();
      if (userId && userId.trim() !== '') {
        // User is logged in, redirect to ratings
        await this.router.replace('/?page=badminton&section=ratings');
      } else {
        // User is not logged in, redirect to login
        await this.router.replace('/?page=badminton&section=login');
      }
    }
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
      console.log('Current page:', this.page, 'section:', this.section);
      
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

