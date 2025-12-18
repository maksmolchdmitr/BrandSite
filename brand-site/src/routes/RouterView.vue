<template>
  <component :is="currentComponent" v-bind="componentProps"/>
</template>

<script>
import {defineComponent, markRaw} from "vue";
import {useRoute} from "vue-router";
import Main from "@/routes/Main.vue";
import TouchMe from "@/routes/TouchMe.vue";
import Products from "@/routes/Products.vue";
import BadmintonService from "@/routes/BadmintonService.vue";
import BadmintonLogin from "@/routes/BadmintonLogin.vue";
import BadmintonGroups from "@/routes/BadmintonGroups.vue";
import BadmintonGroup from "@/routes/BadmintonGroup.vue";
import BadmintonRatings from "@/routes/BadmintonRatings.vue";
import BadmintonGames from "@/routes/BadmintonGames.vue";

export default defineComponent({
  setup() {
    const route = useRoute();
    return { route };
  },
  mounted() {
    console.log('RouterView mounted with query:', this.route.query);
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
        return markRaw(BadmintonService);
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

