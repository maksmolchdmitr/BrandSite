<template>
  <div class="pagerRow">
    <button
      class="pagerButton"
      :disabled="!canGoPrev"
      @click="$emit('prev')"
    >
      ←
    </button>
    <span class="pagerPage">{{ $t('common.pager.page', { page: currentPageIndex + 1 }) }}</span>
    <button
      class="pagerButton"
      :disabled="!canGoNext"
      @click="$emit('next')"
    >
      →
    </button>
    <div class="pagerLimit">
      <span class="pagerLimitLabel">{{ $t('common.pager.perPage') }}</span>
      <div class="pagerLimitSelect" @click="$emit('toggleLimit')">
        <span>{{ limit }}</span>
        <span class="pagerLimitArrow">▾</span>
        <div v-if="showLimitDropdown" class="pagerLimitDropdown">
          <div
            v-for="opt in limitOptions"
            :key="opt"
            class="pagerLimitOption"
            :class="{ active: opt === limit }"
            @click.stop="$emit('changeLimit', opt)"
          >
            {{ opt }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "PagerBar",
  props: {
    currentPageIndex: { type: Number, default: 0 },
    canGoPrev: { type: Boolean, default: false },
    canGoNext: { type: Boolean, default: false },
    limit: { type: Number, default: 10 },
    limitOptions: { type: Array, default: () => [10, 20, 50] },
    showLimitDropdown: { type: Boolean, default: false },
  },
  emits: ["prev", "next", "toggleLimit", "changeLimit"],
});
</script>

<style scoped>
.pagerRow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
  max-width: 100%;
  min-width: 0;
}
.pagerButton {
  border: 2px solid #4F3DFF;
  background-color: white;
  border-radius: 999px;
  padding: 6px 14px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  color: #4F3DFF;
  cursor: pointer;
}
.pagerButton:disabled {
  opacity: 0.5;
  cursor: default;
}
.pagerPage {
  font-family: var(--font-display);
  font-size: 16px;
}
.pagerLimit {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
  min-width: 0;
}
.pagerLimitLabel {
  font-family: var(--font-display);
  font-size: 14px;
}
.pagerLimitSelect {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 100px;
  border: 2px solid #4F3DFF;
  background-color: white;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: #4F3DFF;
  cursor: pointer;
}
.pagerLimitArrow { font-size: 10px; }
.pagerLimitDropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  z-index: 10;
}
.pagerLimitOption {
  padding: 8px 12px;
  font-family: var(--font-display);
  font-size: 14px;
  cursor: pointer;
}
.pagerLimitOption:hover { background-color: #f6f6ff; }
.pagerLimitOption.active { font-weight: 700; color: #4F3DFF; }

@media (prefers-color-scheme: dark) {
  .pagerButton,
  .pagerLimitSelect {
    background-color: #2d2d2d;
  }

  .pagerLimitDropdown {
    background: #2d2d2d;
    border-color: #4a4a4a;
  }

  .pagerLimitOption:hover {
    background-color: #3a3a3a;
  }
}
</style>
