<template>
  <div class="periodRow" role="group" :aria-label="ariaLabel">
    <button
      v-for="opt in presets"
      :key="opt.id"
      type="button"
      class="periodBtn"
      :class="{ active: modelValue === opt.id }"
      :disabled="disabled"
      @click="$emit('update:modelValue', opt.id)"
    >{{ opt.id }}</button>
    <form
      class="customWrap"
      @submit.prevent="applyCustom"
      @mouseenter="showHint"
      @mouseleave="hideHint"
    >
      <input
        v-model="draft"
        class="periodInput"
        :class="{ active: isCustomActive, invalid: showInvalid }"
        type="text"
        maxlength="6"
        :disabled="disabled"
        :aria-label="customLabel"
        :aria-describedby="hintId"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        @focus="onFocus"
        @blur="onBlur"
        @touchstart.passive="onTouchStart"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
        @touchmove.passive="onTouchMove"
      >
      <span :id="hintId" class="srOnly">{{ hint }}</span>
      <div
        v-if="hintVisible && hint"
        class="hintBubble"
        role="tooltip"
      >{{ hint }}</div>
    </form>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import {
  parseRatingHistoryPeriod,
  RATING_HISTORY_PERIOD_PRESETS,
} from "@/badminton/ratingHistory.js";

function draftForPeriod(periodId) {
  const isPreset = RATING_HISTORY_PERIOD_PRESETS.some((opt) => opt.id === periodId);
  return isPreset ? "" : String(periodId || "");
}

export default defineComponent({
  name: "RatingHistoryPeriodPicker",
  props: {
    modelValue: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    ariaLabel: { type: String, default: "" },
    customLabel: { type: String, default: "" },
    hint: { type: String, default: "" },
  },
  emits: ["update:modelValue", "invalid"],
  data() {
    return {
      draft: draftForPeriod(this.modelValue),
      showInvalid: false,
      hintVisible: false,
      presets: RATING_HISTORY_PERIOD_PRESETS,
      hintId: `period-hint-${Math.random().toString(36).slice(2, 9)}`,
      holdTimer: null,
      hideTimer: null,
    };
  },
  computed: {
    isCustomActive() {
      return !this.presets.some((opt) => opt.id === this.modelValue);
    },
  },
  watch: {
    modelValue(next) {
      this.draft = draftForPeriod(next);
      this.showInvalid = false;
    },
  },
  beforeUnmount() {
    this.clearHoldTimer();
    this.clearHideTimer();
  },
  methods: {
    showHint() {
      if (this.disabled || !this.hint) return;
      this.clearHideTimer();
      this.hintVisible = true;
    },
    hideHint() {
      this.clearHideTimer();
      this.hintVisible = false;
    },
    clearHoldTimer() {
      if (this.holdTimer != null) {
        clearTimeout(this.holdTimer);
        this.holdTimer = null;
      }
    },
    clearHideTimer() {
      if (this.hideTimer != null) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
    },
    onTouchStart() {
      this.clearHoldTimer();
      this.clearHideTimer();
      this.holdTimer = setTimeout(() => {
        this.holdTimer = null;
        this.showHint();
      }, 450);
    },
    onTouchMove() {
      this.clearHoldTimer();
    },
    onTouchEnd() {
      this.clearHoldTimer();
      if (!this.hintVisible) return;
      this.clearHideTimer();
      this.hideTimer = setTimeout(() => {
        this.hideTimer = null;
        this.hintVisible = false;
      }, 1600);
    },
    onFocus() {
      this.showInvalid = false;
      this.hideHint();
    },
    onBlur() {
      if (!String(this.draft || "").trim()) {
        this.draft = draftForPeriod(this.modelValue);
        this.showInvalid = false;
      }
    },
    applyCustom() {
      const parsed = parseRatingHistoryPeriod(this.draft);
      if (!parsed) {
        this.showInvalid = true;
        this.$emit("invalid", this.draft);
        return;
      }
      this.showInvalid = false;
      this.draft = parsed.id;
      this.$emit("update:modelValue", parsed.id);
    },
  },
});
</script>

<style scoped>
.periodRow {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  padding: 4px;
  border-radius: 999px;
  background: #f3f1ff;
  border: 1px solid rgba(79, 61, 255, 0.12);
}
.periodBtn {
  border: none;
  cursor: pointer;
  background: transparent;
  color: #4F3DFF;
  border-radius: 999px;
  padding: 8px 12px;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
}
.periodBtn.active {
  background: #4F3DFF;
  color: white;
}
.periodBtn:disabled {
  opacity: 0.7;
  cursor: default;
}
.customWrap {
  position: relative;
  display: inline-flex;
  margin: 0;
}
.periodInput {
  width: 48px;
  border: none;
  outline: none;
  background: transparent;
  color: #4F3DFF;
  border-radius: 999px;
  padding: 8px 10px;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  box-sizing: border-box;
}
.periodInput.active {
  background: #4F3DFF;
  color: white;
}
.periodInput.invalid {
  background: #ffe6e6;
  color: #b00020;
}
.periodInput:disabled {
  opacity: 0.7;
  cursor: default;
}
.hintBubble {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  z-index: 5;
  max-width: 220px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #2a2a3a;
  color: #fff;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  white-space: normal;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 6px 18px rgba(20, 16, 48, 0.22);
}
.hintBubble::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #2a2a3a;
}
.srOnly {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-color-scheme: dark) {
  .periodRow {
    background: #34323f;
    border-color: #4a4860;
  }
  .periodBtn {
    color: #c7bcff;
  }
  .periodBtn.active {
    background: #4F3DFF;
    color: white;
  }
  .periodInput {
    color: #c7bcff;
  }
  .periodInput.active {
    background: #4F3DFF;
    color: white;
  }
  .periodInput.invalid {
    background: #4a1f1f;
    color: #ffd6d6;
  }
  .hintBubble {
    background: #1c1b24;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  }
  .hintBubble::after {
    border-top-color: #1c1b24;
  }
}
</style>
