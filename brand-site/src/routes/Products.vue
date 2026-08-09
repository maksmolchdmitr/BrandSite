<template>
  <div class="page">
    <HeadBar :headItems="localizedHeadItems"></HeadBar>

    <div class="content">
      <RouterLink class="productCard" to="/?page=badminton">
        <div class="cardInner">
          <img
            class="cardLogo"
            src="@/assets/badminton-service-logo.png"
            alt="badminton-service"
            width="72"
            height="72"
          />
          <div class="cardText">
            <div class="cardTitle">{{ $t('products.badmintonTitle') }}</div>
            <div class="cardSubtitle">{{ $t('products.badmintonSubtitle') }}</div>
          </div>
        </div>
      </RouterLink>
    </div>
  </div>
</template>

<script>

import {defineComponent} from "vue";
import HeadBar from "@/components/HeadBar.vue";

export default defineComponent({
  components: {HeadBar},
  computed: {
    localizedHeadItems() {
      return [
        { text: this.$t('common.nav.main'), ref: '/?page=main', isMainSwitch: false },
        { text: this.$t('common.nav.touchMe'), ref: '/?page=contact', isMainSwitch: false },
        { text: this.$t('common.nav.products'), ref: '/?page=products', isMainSwitch: true },
      ];
    },
  },
  data() {
    return {}
  }
})
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 64px;
  max-width: 100%;
  box-sizing: border-box;
}

.content {
  padding: 0 50px 50px 50px;
  max-width: 100%;
  box-sizing: border-box;
}

.productCard {
  text-decoration: none;
  display: flex;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.cardInner {
  background-color: #4F3DFF;
  border-radius: 28px;
  padding: 24px 28px;
  width: 100%;
  max-width: min(720px, 100%);
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 18px;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.cardInner:hover {
  transform: scale(1.01);
  filter: brightness(95%);
}

.cardLogo {
  width: 72px;
  height: 72px;
  border-radius: 18px;
  flex: 0 0 auto;
  object-fit: cover;
  background: #F7F6FF;
  box-shadow: 0 6px 18px rgba(20, 10, 80, 0.22);
}

.cardText {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.cardTitle {
  font-family: var(--font-display);
  font-size: 40px;
  font-weight: 700;
  color: white;
}

.cardSubtitle {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

@media (max-width: 768px) {
  .page {
    gap: 12px;
  }

  .content {
    padding: 0 20px 20px 20px;
  }

  .cardInner {
    max-width: 100%;
    padding: 16px 18px;
    border-radius: 20px;
    gap: 14px;
  }

  .cardLogo {
    width: 56px;
    height: 56px;
    border-radius: 14px;
  }

  .cardTitle {
    font-size: 28px;
  }

  .cardSubtitle {
    font-size: 16px;
  }
}
</style>
