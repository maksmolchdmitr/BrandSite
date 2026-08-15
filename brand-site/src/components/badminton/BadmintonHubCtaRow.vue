<template>
  <div class="ctaRow">
    <RouterLink
      v-if="current !== 'ratings'"
      class="cta secondary cta-ratings"
      to="/?page=badminton&section=ratings"
    >
      <span class="ctaText">{{ $t("badminton.groups.myRatings") }}</span>
    </RouterLink>
    <RouterLink
      v-if="current !== 'rating-history'"
      class="cta secondary cta-rating-history"
      to="/?page=badminton&section=rating-history"
    >
      <span class="ctaText">{{ $t("badminton.ratings.historyNav") }}</span>
    </RouterLink>
    <RouterLink
      v-if="current !== 'doubles-rating-history'"
      class="cta secondary cta-doubles-rating-history"
      to="/?page=badminton&section=doubles-rating-history"
    >
      <span class="ctaText">{{ $t("badminton.ratings.doublesHistoryNav") }}</span>
    </RouterLink>
    <RouterLink
      v-if="current !== 'games'"
      class="cta secondary cta-games-hub"
      :to="gamesTo"
    >
      <span class="ctaText">{{ $t("badminton.groups.myMatches") }}</span>
    </RouterLink>
    <RouterLink
      v-if="current !== 'profile'"
      class="cta secondary cta-profile"
      to="/?page=badminton&section=profile"
    >
      <span class="ctaText">{{ $t("badminton.profile.title") }}</span>
    </RouterLink>
    <RouterLink
      v-if="current !== 'invitations'"
      class="cta secondary cta-invitations"
      to="/?page=badminton&section=invitations"
    >
      <span class="ctaText">{{ $t("badminton.invitations.title") }}</span>
    </RouterLink>
    <RouterLink
      v-if="current !== 'groups'"
      class="cta secondary cta-groups"
      to="/?page=badminton&section=groups"
    >
      <span class="ctaText">{{ $t("badminton.ratings.myGroups") }}</span>
    </RouterLink>
    <button
      class="cta secondary cta-logout"
      type="button"
      :disabled="disabled"
      @click="$emit('logout')"
    >
      <span class="ctaText">{{ $t("common.actions.logout") }}</span>
    </button>
    <RouterLink class="cta secondary cta-back" to="/?page=products">
      <span class="ctaText">{{ $t("common.actions.backToProducts") }}</span>
    </RouterLink>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { gamesSectionTo } from "@/badminton/uiPrefs.js";

export default defineComponent({
  name: "BadmintonHubCtaRow",
  props: {
    current: {
      type: String,
      required: true,
      validator: (v) => ["ratings", "rating-history", "doubles-rating-history", "games", "profile", "groups", "invitations"].includes(v),
    },
    disabled: { type: Boolean, default: false },
  },
  emits: ["logout"],
  computed: {
    gamesTo() {
      return gamesSectionTo();
    },
  },
});
</script>

<style scoped>
.ctaRow {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  max-width: 100%;
  min-width: 0;
}

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

.cta.secondary {
  background-color: white;
  border: 2px solid #4F3DFF;
}

.cta-ratings.secondary {
  background-color: #F3E5F5;
  border-color: #9C27B0;
}
.cta-ratings.secondary .ctaText {
  color: #9C27B0;
}

.cta-rating-history.secondary {
  background-color: #FCE4EC;
  border-color: #E91E63;
}
.cta-rating-history.secondary .ctaText {
  color: #C2185B;
}

.cta-doubles-rating-history.secondary {
  background-color: #E0F7FA;
  border-color: #00ACC1;
}
.cta-doubles-rating-history.secondary .ctaText {
  color: #00838F;
}

.cta-games-hub.secondary {
  background-color: #EDE7F6;
  border-color: #673AB7;
}
.cta-games-hub.secondary .ctaText {
  color: #5E35B1;
}

.cta-profile.secondary {
  background-color: #E3F2FD;
  border-color: #2196F3;
}
.cta-profile.secondary .ctaText {
  color: #1976D2;
}

.cta-groups.secondary {
  background-color: #E8F5E9;
  border-color: #4CAF50;
}
.cta-groups.secondary .ctaText {
  color: #4CAF50;
}

.cta-logout.secondary {
  background-color: #FFE8E8;
  border-color: #FF6B6B;
}
.cta-logout.secondary .ctaText {
  color: #FF6B6B;
}

.cta-back.secondary {
  background-color: #F5F5F5;
  border-color: #888888;
}
.cta-back.secondary .ctaText {
  color: #888888;
}

.cta:disabled {
  cursor: default;
  opacity: 0.7;
}

.ctaText {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: white;
}

.cta.secondary .ctaText {
  color: #4F3DFF;
}

@media (max-width: 768px) {
  .ctaText {
    font-size: 18px;
  }
}

@media (prefers-color-scheme: dark) {
  .cta.secondary {
    background-color: #2d2d2d;
  }
}
</style>
