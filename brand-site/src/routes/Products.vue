<template>
  <div class="page">
    <HeadBar :headItems="headItems"></HeadBar>

    <div class="content">
      <RouterLink class="productCard" to="/badminton-service">
        <div class="cardInner">
          <div class="cardTitle">Badminton Service</div>
          <div class="cardSubtitle">Groups • Matches • Elo • Telegram auth</div>
        </div>
      </RouterLink>
    </div>
  </div>
<!--  <div class="random-walk-link">-->
<!--    <a href="https://github.com/ru-random-walk/mobile_app/releases/download/v0.0.7-beta/app-release.apk" target="_blank">-->
<!--      <img src="@/assets/RandomWalk.svg" alt="Random Walk"/>-->
<!--      <span>Random Walk Android App</span>-->
<!--    </a>-->
<!--  </div>-->
</template>

<script>

import {defineComponent} from "vue";
import HeadBar from "@/components/HeadBar.vue";

export default defineComponent({
  components: {HeadBar},
  data() {
    return {
      headItems: [
        {
          text: 'Main',
          ref: '/',
          isMainSwitch: false
        },
        {
          text: 'Touch me',
          ref: '/contact',
          isMainSwitch: false
        },
        {
          text: 'Products',
          ref: '/products',
          isMainSwitch: true
        }
      ]
    }
  }
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 64px;
}

.content {
  padding: 0 50px 50px 50px;
}

.productCard {
  text-decoration: none;
  display: inline-flex;
}

.cardInner {
  background-color: #4F3DFF;
  border-radius: 28px;
  padding: 24px 28px;
  min-width: min(720px, calc(100vw - 100px));
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.cardInner:hover {
  transform: scale(1.01);
  filter: brightness(95%);
}

.cardTitle {
  font-family: Mali, serif;
  font-size: 40px;
  font-weight: 700;
  color: white;
}

.cardSubtitle {
  font-family: Mali, serif;
  font-size: 20px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.random-walk-link {
  margin-top: 20px;
  text-align: center;
}

.random-walk-link a {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
}

.random-walk-link img {
  width: 50%; /* Adjust size as needed */
  height: 50%; /* Adjust size as needed */
}

@media (max-width: 768px) {
  .page {
    gap: 12px;
  }

  .content {
    padding: 0 20px 20px 20px;
  }

  .cardInner {
    min-width: calc(100vw - 40px);
    padding: 16px 18px;
    border-radius: 20px;
  }

  .cardTitle {
    font-size: 28px;
  }

  .cardSubtitle {
    font-size: 16px;
  }
}
</style>