<template>
  <a :href="logoRef" target="_blank" rel="noopener noreferrer" class="linkWrapper">
    <div class="linkContent" :class="{ compact: isCompact }">
      <img class="logoImage" :src="logoImg" :alt="logoText">
      <LinkRefRect v-if="!isCompact"></LinkRefRect>
      <span class="logoText">{{ logoText }}</span>
    </div>
  </a>
</template>

<script>

import {defineComponent} from "vue";
import LinkRefRect from "@/components/LinkRefRect.vue";

export default defineComponent({
  components: {LinkRefRect},
  props: {
    logoImg: {
      type: String,
      required: true
    },
    logoText: {
      type: String,
      required: true
    },
    logoRef: String,
    isCompact: {
      type: Boolean,
      default: false
    }
  }
})
</script>

<style scoped>
.linkWrapper {
  text-decoration: none;
  color: inherit;
  min-width: 0;
}

.linkContent {
  background-color: #4F3DFF;
  border-radius: 100px;
  flex-direction: row;
  gap: 10px;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.linkContent.compact {
  flex-direction: column;
  height: auto;
  padding: 12px 10px;
  gap: 8px;
  border-radius: 20px;
  width: 100%;
}

.logoText {
  font-size: 36px;
  color: white;
  font-family: var(--font-display);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.linkContent.compact .logoText {
  font-size: 14px;
  white-space: normal;
  text-align: center;
  line-height: 1.2;
}

.logoImage {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
}

.linkContent.compact .logoImage {
  width: 32px;
  height: 32px;
}

@media (max-width: 768px) {
  .linkContent {
    gap: 5px;
    padding: 10px;
    height: 30px;
  }

  .logoText {
    font-size: 18px;
  }

  .logoImage {
    width: 30px;
    height: 30px;
  }

  .linkContent.compact {
    padding: 10px 8px;
    gap: 6px;
  }

  .linkContent.compact .logoImage {
    width: 28px;
    height: 28px;
  }

  .linkContent.compact .logoText {
    font-size: 12px;
  }
}
</style>