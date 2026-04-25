<template>
  <div class="page">
    <HeadBar :headItems="localizedHeadItems" />
    <div class="content">
      <div class="topRow">
        <h1 class="title">{{ $t('badminton.gamesHub.title') }}</h1>
      </div>
      <div class="ctaRow">
        <RouterLink class="cta secondary cta-ratings" to="/?page=badminton&section=ratings">
          <span class="ctaText">{{ $t('badminton.gamesHub.myRatings') }}</span>
        </RouterLink>
        <RouterLink class="cta secondary cta-groups" to="/?page=badminton&section=groups">
          <span class="ctaText">{{ $t('badminton.gamesHub.myGroups') }}</span>
        </RouterLink>
        <button class="cta secondary cta-logout" :disabled="loading" @click="logout">
          <span class="ctaText">{{ $t('common.actions.logout') }}</span>
        </button>
        <RouterLink class="cta secondary cta-back" to="/?page=products">
          <span class="ctaText">{{ $t('common.actions.backToProducts') }}</span>
        </RouterLink>
      </div>
      <div v-if="error" class="errorBox">{{ error }}</div>
      <div class="card linksCard">
        <RouterLink class="gameLink" to="/?page=badminton&section=games&tab=singles">
          <span class="gameLinkTitle">{{ $t('badminton.gamesHub.singlesTitle') }}</span>
          <span class="gameLinkDesc">{{ $t('badminton.gamesHub.singlesDesc') }}</span>
        </RouterLink>
        <RouterLink class="gameLink" to="/?page=badminton&section=games&tab=doubles">
          <span class="gameLinkTitle">{{ $t('badminton.gamesHub.doublesTitle') }}</span>
          <span class="gameLinkDesc">{{ $t('badminton.gamesHub.doublesDesc') }}</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import HeadBar from "@/components/HeadBar.vue";
import { badmintonClient } from "@/badminton/client.js";

export default defineComponent({
  name: "BadmintonGamesHub",
  components: { HeadBar },
  data() {
    return {
      loading: false,
      error: "",
    };
  },
  computed: {
    localizedHeadItems() {
      return [
        { text: this.$t("common.nav.main"), ref: "/?page=main", isMainSwitch: false },
        { text: this.$t("common.nav.products"), ref: "/?page=products", isMainSwitch: false },
        { text: this.$t("common.nav.badminton"), ref: "/?page=badminton&section=ratings", isMainSwitch: true },
      ];
    },
  },
  methods: {
    async logout() {
      this.loading = true;
      this.error = "";
      try {
        await badmintonClient.logout();
        await this.$router.push("/?page=badminton&section=login");
      } catch (e) {
        this.error = e?.message || this.$t("badminton.login.errLogout");
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 64px; }
.content { padding: 0 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; }
.topRow { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; }
.title { margin: 0; font-family: var(--font-display); font-size: 40px; font-weight: 700; }

.ctaRow { display: flex; gap: 16px; flex-wrap: wrap; }
.cta {
  text-decoration: none;
  background-color: #4F3DFF;
  border-radius: 100px;
  padding: 16px 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}
.cta.secondary { background-color: white; border: 2px solid #4F3DFF; }
.cta-ratings.secondary { background-color: #F3E5F5; border-color: #9C27B0; }
.cta-ratings.secondary .ctaText { color: #9C27B0; }
.cta-groups.secondary { background-color: #E8F5E9; border-color: #4CAF50; }
.cta-groups.secondary .ctaText { color: #4CAF50; }
.cta-logout.secondary { background-color: #FFE8E8; border-color: #FF6B6B; }
.cta-logout.secondary .ctaText { color: #FF6B6B; }
.cta-back.secondary { background-color: #F5F5F5; border-color: #888888; }
.cta-back.secondary .ctaText { color: #888888; }
.cta:disabled { cursor: default; opacity: 0.7; }
.ctaText { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: white; }
.cta.secondary .ctaText { color: #4F3DFF; }

.card { background: white; border-radius: 18px; padding: 20px; }
.linksCard { display: flex; flex-direction: column; gap: 12px; }
.gameLink {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e0e0ff;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s, border-color 0.2s;
}
.gameLink:hover { background: #fafaff; border-color: #4F3DFF; }
.gameLinkTitle { font-family: var(--font-display); font-weight: 700; font-size: 20px; color: #4F3DFF; }
.gameLinkDesc { font-family: var(--font-display); font-size: 14px; opacity: 0.8; }

.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: var(--font-display); }

@media (max-width: 768px) {
  .content { padding: 0 20px 20px 20px; }
  .title { font-size: 28px; }
  .ctaText { font-size: 18px; }
}
</style>
