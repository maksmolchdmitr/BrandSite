<template>
  <div v-if="src" class="cropEditor">
    <div
      ref="stage"
      class="cropStage"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <img
        ref="image"
        class="cropImage"
        :src="src"
        alt=""
        referrerpolicy="no-referrer"
        draggable="false"
        @load="onImageLoad"
      />
      <div v-if="rect" class="cropBox" :style="boxStyle"></div>
    </div>
    <div class="cropActions">
      <button type="button" class="btn secondary small" @click="resetCrop">
        {{ resetLabel }}
      </button>
      <span class="cropHint">{{ hint }}</span>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { isValidPhotoCrop } from "@/badminton/photoCrop.js";

export default defineComponent({
  name: "PhotoCropEditor",
  props: {
    src: { type: String, default: "" },
    modelValue: { type: Object, default: null },
    resetLabel: { type: String, default: "Reset crop" },
    hint: { type: String, default: "" },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      dragging: false,
      startNorm: null,
      liveRect: null,
      natural: { w: 0, h: 0 },
    };
  },
  computed: {
    rect() {
      return this.liveRect || (isValidPhotoCrop(this.modelValue) ? this.modelValue : null);
    },
    boxStyle() {
      const r = this.rect;
      if (!r) return null;
      return {
        left: `${r.x * 100}%`,
        top: `${r.y * 100}%`,
        width: `${r.width * 100}%`,
        height: `${r.height * 100}%`,
      };
    },
  },
  watch: {
    src() {
      this.liveRect = null;
    },
  },
  methods: {
    onImageLoad() {
      const img = this.$refs.image;
      if (!img) return;
      this.natural = { w: img.naturalWidth || 0, h: img.naturalHeight || 0 };
    },
    toNorm(clientX, clientY) {
      const stage = this.$refs.stage;
      if (!stage) return { x: 0, y: 0 };
      const bounds = stage.getBoundingClientRect();
      const x = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width));
      const y = Math.min(1, Math.max(0, (clientY - bounds.top) / bounds.height));
      return { x, y };
    },
    onPointerDown(event) {
      if (!this.src) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      this.dragging = true;
      this.startNorm = this.toNorm(event.clientX, event.clientY);
      this.liveRect = { x: this.startNorm.x, y: this.startNorm.y, width: 0.01, height: 0.01 };
    },
    onPointerMove(event) {
      if (!this.dragging || !this.startNorm) return;
      const cur = this.toNorm(event.clientX, event.clientY);
      const x = Math.min(this.startNorm.x, cur.x);
      const y = Math.min(this.startNorm.y, cur.y);
      const width = Math.max(0.02, Math.abs(cur.x - this.startNorm.x));
      const height = Math.max(0.02, Math.abs(cur.y - this.startNorm.y));
      this.liveRect = {
        x,
        y,
        width: Math.min(width, 1 - x),
        height: Math.min(height, 1 - y),
      };
    },
    onPointerUp() {
      if (!this.dragging) return;
      this.dragging = false;
      this.startNorm = null;
      if (isValidPhotoCrop(this.liveRect)) {
        this.$emit("update:modelValue", { ...this.liveRect });
      }
      this.liveRect = null;
    },
    resetCrop() {
      this.liveRect = null;
      this.$emit("update:modelValue", null);
    },
  },
});
</script>

<style scoped>
.cropEditor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cropStage {
  position: relative;
  width: min(100%, 320px);
  aspect-ratio: 1;
  overflow: hidden;
  background: #111;
  border-radius: 12px;
  touch-action: none;
  user-select: none;
  cursor: crosshair;
}
.cropImage {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  display: block;
}
.cropBox {
  position: absolute;
  border: 2px solid #fff;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
.cropActions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.cropHint {
  font-size: 13px;
  opacity: 0.7;
}
.btn.secondary.small {
  padding: 6px 12px;
  font-size: 13px;
}
</style>
