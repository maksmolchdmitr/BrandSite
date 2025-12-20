<template>
  <div class="page">
    <HeadBar :headItems="headItems"></HeadBar>

    <div class="content">
      <h1 class="title">Badminton Service</h1>
      <p class="subtitle">
        Управление группами, участниками и результатами игр. Рейтинги Эло, статистика и вход через Telegram.
      </p>

      <div class="ctaRow">
        <template v-if="!isLoggedIn">
          <RouterLink class="cta" to="/?page=badminton&section=login">
            <span class="ctaText">🔐 Login / Авторизация</span>
          </RouterLink>
        </template>
        <template v-else>
          <RouterLink class="cta" to="/?page=badminton&section=ratings">
            <span class="ctaText">My ratings</span>
          </RouterLink>
          <RouterLink class="cta secondary" to="/?page=badminton&section=games">
            <span class="ctaText">My games</span>
          </RouterLink>
          <RouterLink class="cta secondary" to="/?page=badminton&section=groups">
            <span class="ctaText">My groups</span>
          </RouterLink>
        </template>
        <RouterLink class="cta secondary" to="/?page=products">
          <span class="ctaText">← Back to Products</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import HeadBar from "@/components/HeadBar.vue";
import {getLoggedInUserId} from "@/badminton/cookies.js";

export default defineComponent({
  components: {HeadBar},
  data() {
    return {
      headItems: [
        {text: "Main", ref: "/?page=main", isMainSwitch: false},
        {text: "Touch me", ref: "/?page=contact", isMainSwitch: false},
        {text: "Products", ref: "/?page=products", isMainSwitch: false},
      ],
      isLoggedIn: false,
    };
  },
  mounted() {
    this.updateAuthStatus();
    // Listen for storage events to update when login happens in another tab/window
    window.addEventListener('storage', this.updateAuthStatus);
    // Also listen for custom login events
    window.addEventListener('badminton-login', this.updateAuthStatus);
    window.addEventListener('badminton-logout', this.updateAuthStatus);
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.updateAuthStatus);
    window.removeEventListener('badminton-login', this.updateAuthStatus);
    window.removeEventListener('badminton-logout', this.updateAuthStatus);
  },
  watch: {
    // Watch for route changes to update auth status
    '$route'() {
      this.updateAuthStatus();
    },
  },
  methods: {
    updateAuthStatus() {
      const userId = getLoggedInUserId();
      this.isLoggedIn = Boolean(userId && userId.trim() !== '');
    },
  },
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Mali&display=swap');

.page {
  display: flex;
  flex-direction: column;
  gap: 64px;
}

.content {
  padding: 0 50px 50px 50px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.title {
  margin: 0;
  font-family: 'Mali', 'sans-serif';
  font-size: 48px;
  font-weight: 700;
  color: black;
}

.subtitle {
  margin: 0;
  font-family: 'Mali', 'sans-serif';
  font-size: 24px;
  color: black;
  max-width: 960px;
}

.ctaRow {
  margin-top: 12px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.cta {
  text-decoration: none;
  background-color: #4F3DFF;
  border-radius: 100px;
  padding: 16px 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cta.secondary {
  background-color: white;
  border: 2px solid #4F3DFF;
}

.ctaText {
  font-family: 'Mali', 'sans-serif';
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.cta.secondary .ctaText {
  color: #4F3DFF;
}

@media (max-width: 768px) {
  .page {
    gap: 12px;
  }

  .content {
    padding: 0 20px 20px 20px;
  }

  .title {
    font-size: 32px;
  }

  .subtitle {
    font-size: 18px;
  }

  .ctaText {
    font-size: 18px;
  }
}
</style>


