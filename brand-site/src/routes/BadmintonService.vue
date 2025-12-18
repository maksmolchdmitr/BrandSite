<template>
  <div class="page">
    <HeadBar :headItems="headItems"></HeadBar>

    <div class="content">
      <h1 class="title">Badminton Service</h1>
      <p class="subtitle">
        Управление группами, участниками и результатами игр. Рейтинги Эло, статистика и вход через Telegram.
      </p>

      <div class="ctaRow">
        <RouterLink class="cta" to="/?page=badminton&section=ratings">
          <span class="ctaText">My ratings</span>
        </RouterLink>
        <RouterLink class="cta secondary" to="/?page=badminton&section=games">
          <span class="ctaText">My games</span>
        </RouterLink>
        <RouterLink class="cta secondary" to="/?page=badminton&section=groups">
          <span class="ctaText">My groups</span>
        </RouterLink>
        <a class="cta secondary" href="/badminton-service.openapi.yaml" target="_blank" rel="noreferrer">
          <span class="ctaText">OpenAPI spec</span>
        </a>
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

export default defineComponent({
  components: {HeadBar},
  data() {
    return {
      headItems: [
        {text: "Main", ref: "/?page=main", isMainSwitch: false},
        {text: "Touch me", ref: "/?page=contact", isMainSwitch: false},
        {text: "Products", ref: "/?page=products", isMainSwitch: false},
      ],
    };
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


