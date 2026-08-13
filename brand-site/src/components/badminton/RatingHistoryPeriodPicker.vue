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
    <form class="customWrap" @submit.prevent="applyCustom">
      <input
        v-model="draft"
        class="periodInput"
        :class="{ active: isCustomActive, invalid: showInvalid }"
        type="text"
        maxlength="6"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="customLabel"
        @focus="onFocus"
        @blur="onBlur"
      >
    </form>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import {
  parseRatingHistoryPeriod,
  RATING_HISTORY_PERIOD_PRESETS,
} from "@/badminton/ratingHistory.js";

export default defineComponent({
  name: "RatingHistoryPeriodPicker",
  props: {
    modelValue: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    ariaLabel: { type: String, default: "" },
    customLabel: { type: String, default: "" },
    placeholder: { type: String, default: "3m" },
  },
  emits: ["update:modelValue", "invalid"],
  data() {
    return {
      draft: this.modelValue,
      showInvalid: false,
      presets: RATING_HISTORY_PERIOD_PRESETS,
    };
  },
  computed: {
    isCustomActive() {
      return !this.presets.some((opt) => opt.id === this.modelValue);
    },
  },
  watch: {
    modelValue(next) {
      this.draft = next;
      this.showInvalid = false;
    },
  },
  methods: {
    onFocus() {
      this.showInvalid = false;
    },
    onBlur() {
      if (!String(this.draft || "").trim()) {
        this.draft = this.modelValue;
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
  display: inline-flex;
  margin: 0;
}
.periodInput {
  width: 52px;
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
.periodInput::placeholder {
  color: #9a92ff;
  opacity: 0.75;
  font-weight: 600;
}
.periodInput.active {
  background: #4F3DFF;
  color: white;
}
.periodInput.active::placeholder {
  color: rgba(255, 255, 255, 0.7);
}
.periodInput.invalid {
  background: #ffe6e6;
  color: #b00020;
}
.periodInput:disabled {
  opacity: 0.7;
  cursor: default;
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
  .periodInput::placeholder {
    color: #8e86c8;
  }
  .periodInput.active {
    background: #4F3DFF;
    color: white;
  }
  .periodInput.invalid {
    background: #4a1f1f;
    color: #ffd6d6;
  }
}
</style>
