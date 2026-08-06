<template>
  <div v-if="src" class="cropEditor">
    <div
      ref="stage"
      class="cropStage"
      :style="{ cursor: stageCursor }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <img
        class="cropImage"
        :src="src"
        alt=""
        referrerpolicy="no-referrer"
        draggable="false"
      />
      <div v-if="rect" class="cropBox" :style="boxStyle">
        <span
          v-for="handle in handles"
          :key="handle"
          class="cropHandle"
          :class="`cropHandle--${handle}`"
          :data-handle="handle"
        />
      </div>
    </div>
    <div class="cropActions">
      <button
        type="button"
        class="btn secondary small"
        :class="{ active: squareAspect }"
        @click="toggleSquareAspect"
      >
        {{ squareLabel }}
      </button>
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

const MIN_SIZE = 0.02;
const HANDLE_PX = 14;
const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function clampRect(rect) {
  let { x, y, width, height } = rect;
  width = clamp(width, MIN_SIZE, 1);
  height = clamp(height, MIN_SIZE, 1);
  x = clamp(x, 0, 1 - width);
  y = clamp(y, 0, 1 - height);
  return { x, y, width, height };
}

function toSquare(rect) {
  const size = Math.max(MIN_SIZE, Math.min(rect.width, rect.height));
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  return clampRect({
    x: cx - size / 2,
    y: cy - size / 2,
    width: size,
    height: size,
  });
}

function hitTest(rect, norm, threshold) {
  if (!rect) return null;
  const { x, y, width, height } = rect;
  const nearL = Math.abs(norm.x - x) <= threshold;
  const nearR = Math.abs(norm.x - (x + width)) <= threshold;
  const nearT = Math.abs(norm.y - y) <= threshold;
  const nearB = Math.abs(norm.y - (y + height)) <= threshold;
  const insideX = norm.x >= x - threshold && norm.x <= x + width + threshold;
  const insideY = norm.y >= y - threshold && norm.y <= y + height + threshold;
  if (!insideX || !insideY) return null;
  if (nearT && nearL) return "nw";
  if (nearT && nearR) return "ne";
  if (nearB && nearL) return "sw";
  if (nearB && nearR) return "se";
  if (nearT) return "n";
  if (nearB) return "s";
  if (nearL) return "w";
  if (nearR) return "e";
  if (norm.x >= x && norm.x <= x + width && norm.y >= y && norm.y <= y + height) {
    return "move";
  }
  return null;
}

function cursorFor(hit) {
  if (!hit) return "crosshair";
  if (hit === "move") return "move";
  if (hit === "n" || hit === "s") return "ns-resize";
  if (hit === "e" || hit === "w") return "ew-resize";
  if (hit === "nw" || hit === "se") return "nwse-resize";
  if (hit === "ne" || hit === "sw") return "nesw-resize";
  return "crosshair";
}

export default defineComponent({
  name: "PhotoCropEditor",
  props: {
    src: { type: String, default: "" },
    modelValue: { type: Object, default: null },
    resetLabel: { type: String, default: "Reset crop" },
    squareLabel: { type: String, default: "1:1" },
    hint: { type: String, default: "" },
  },
  emits: ["update:modelValue"],
  data() {
    return {
      dragging: false,
      dragMode: null,
      resizeHandle: null,
      startNorm: null,
      originRect: null,
      liveRect: null,
      hoverHit: null,
      squareAspect: false,
      handles: HANDLES,
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
    stageCursor() {
      if (this.dragging) {
        if (this.dragMode === "move") return "move";
        if (this.dragMode === "resize") return cursorFor(this.resizeHandle);
        return "crosshair";
      }
      return cursorFor(this.hoverHit);
    },
  },
  watch: {
    src() {
      this.liveRect = null;
      this.squareAspect = false;
      this.hoverHit = null;
    },
  },
  methods: {
    handleThreshold() {
      const stage = this.$refs.stage;
      if (!stage) return 0.04;
      const bounds = stage.getBoundingClientRect();
      const size = Math.min(bounds.width, bounds.height) || 1;
      return HANDLE_PX / size;
    },
    toNorm(clientX, clientY) {
      const stage = this.$refs.stage;
      if (!stage) return { x: 0, y: 0 };
      const bounds = stage.getBoundingClientRect();
      const x = clamp((clientX - bounds.left) / bounds.width, 0, 1);
      const y = clamp((clientY - bounds.top) / bounds.height, 0, 1);
      return { x, y };
    },
    currentRect() {
      if (this.liveRect) return this.liveRect;
      return isValidPhotoCrop(this.modelValue) ? { ...this.modelValue } : null;
    },
    emitRect(rect) {
      if (!isValidPhotoCrop(rect)) return;
      this.$emit("update:modelValue", { ...rect });
    },
    toggleSquareAspect() {
      this.squareAspect = !this.squareAspect;
      if (!this.squareAspect) return;
      const current = this.currentRect();
      if (!current) return;
      const squared = toSquare(current);
      this.liveRect = null;
      this.emitRect(squared);
    },
    drawRect(start, cur) {
      let width = Math.abs(cur.x - start.x);
      let height = Math.abs(cur.y - start.y);
      if (this.squareAspect) {
        const size = Math.max(width, height, MIN_SIZE);
        width = size;
        height = size;
      } else {
        width = Math.max(MIN_SIZE, width);
        height = Math.max(MIN_SIZE, height);
      }
      let x = cur.x < start.x ? start.x - width : start.x;
      let y = cur.y < start.y ? start.y - height : start.y;
      if (x < 0) {
        width += x;
        x = 0;
      }
      if (y < 0) {
        height += y;
        y = 0;
      }
      if (this.squareAspect) {
        const size = Math.min(width, height, 1 - x, 1 - y);
        width = size;
        height = size;
        if (cur.x < start.x) x = start.x - width;
        if (cur.y < start.y) y = start.y - height;
        x = clamp(x, 0, 1 - width);
        y = clamp(y, 0, 1 - height);
      } else {
        width = Math.min(width, 1 - x);
        height = Math.min(height, 1 - y);
      }
      return clampRect({ x, y, width, height });
    },
    moveRect(origin, start, cur) {
      const dx = cur.x - start.x;
      const dy = cur.y - start.y;
      return clampRect({
        x: origin.x + dx,
        y: origin.y + dy,
        width: origin.width,
        height: origin.height,
      });
    },
    resizeRect(origin, handle, cur) {
      let left = origin.x;
      let top = origin.y;
      let right = origin.x + origin.width;
      let bottom = origin.y + origin.height;

      if (handle.includes("w")) left = clamp(cur.x, 0, right - MIN_SIZE);
      if (handle.includes("e")) right = clamp(cur.x, left + MIN_SIZE, 1);
      if (handle.includes("n")) top = clamp(cur.y, 0, bottom - MIN_SIZE);
      if (handle.includes("s")) bottom = clamp(cur.y, top + MIN_SIZE, 1);

      if (!this.squareAspect) {
        return clampRect({
          x: left,
          y: top,
          width: right - left,
          height: bottom - top,
        });
      }

      if (handle === "e" || handle === "w") {
        let size = right - left;
        const cy = origin.y + origin.height / 2;
        size = Math.max(MIN_SIZE, Math.min(size, 2 * cy, 2 * (1 - cy)));
        if (handle === "w") {
          size = Math.min(size, right);
          left = right - size;
        } else {
          size = Math.min(size, 1 - left);
        }
        return clampRect({
          x: left,
          y: cy - size / 2,
          width: size,
          height: size,
        });
      }

      if (handle === "n" || handle === "s") {
        let size = bottom - top;
        const cx = origin.x + origin.width / 2;
        size = Math.max(MIN_SIZE, Math.min(size, 2 * cx, 2 * (1 - cx)));
        if (handle === "n") {
          size = Math.min(size, bottom);
          top = bottom - size;
        } else {
          size = Math.min(size, 1 - top);
        }
        return clampRect({
          x: cx - size / 2,
          y: top,
          width: size,
          height: size,
        });
      }

      const fixedX = handle.includes("w") ? right : left;
      const fixedY = handle.includes("n") ? bottom : top;
      let size = Math.max(Math.abs(cur.x - fixedX), Math.abs(cur.y - fixedY), MIN_SIZE);
      if (handle.includes("w")) size = Math.min(size, fixedX);
      else size = Math.min(size, 1 - fixedX);
      if (handle.includes("n")) size = Math.min(size, fixedY);
      else size = Math.min(size, 1 - fixedY);
      return clampRect({
        x: handle.includes("w") ? fixedX - size : fixedX,
        y: handle.includes("n") ? fixedY - size : fixedY,
        width: size,
        height: size,
      });
    },
    onPointerDown(event) {
      if (!this.src) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const norm = this.toNorm(event.clientX, event.clientY);
      const existing = this.currentRect();
      const hit = hitTest(existing, norm, this.handleThreshold());

      this.dragging = true;
      this.startNorm = norm;
      this.originRect = existing ? { ...existing } : null;
      this.hoverHit = hit;

      if (hit === "move") {
        this.dragMode = "move";
        this.resizeHandle = null;
        this.liveRect = { ...existing };
        return;
      }
      if (hit && hit !== "move") {
        this.dragMode = "resize";
        this.resizeHandle = hit;
        this.liveRect = { ...existing };
        return;
      }
      this.dragMode = "draw";
      this.resizeHandle = null;
      this.liveRect = { x: norm.x, y: norm.y, width: MIN_SIZE, height: MIN_SIZE };
    },
    onPointerMove(event) {
      const cur = this.toNorm(event.clientX, event.clientY);
      if (!this.dragging) {
        this.hoverHit = hitTest(this.currentRect(), cur, this.handleThreshold());
        return;
      }
      if (!this.startNorm) return;
      if (this.dragMode === "draw") {
        this.liveRect = this.drawRect(this.startNorm, cur);
        return;
      }
      if (this.dragMode === "move" && this.originRect) {
        this.liveRect = this.moveRect(this.originRect, this.startNorm, cur);
        return;
      }
      if (this.dragMode === "resize" && this.originRect && this.resizeHandle) {
        this.liveRect = this.resizeRect(this.originRect, this.resizeHandle, cur);
      }
    },
    onPointerUp() {
      if (!this.dragging) return;
      this.dragging = false;
      this.dragMode = null;
      this.resizeHandle = null;
      this.startNorm = null;
      this.originRect = null;
      if (isValidPhotoCrop(this.liveRect)) {
        this.emitRect(this.liveRect);
      }
      this.liveRect = null;
      this.hoverHit = null;
    },
    resetCrop() {
      this.liveRect = null;
      this.squareAspect = false;
      this.hoverHit = null;
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
.cropHandle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.35);
  border-radius: 2px;
  box-sizing: border-box;
  pointer-events: none;
}
.cropHandle--nw { left: -5px; top: -5px; }
.cropHandle--n { left: calc(50% - 5px); top: -5px; }
.cropHandle--ne { right: -5px; top: -5px; }
.cropHandle--e { right: -5px; top: calc(50% - 5px); }
.cropHandle--se { right: -5px; bottom: -5px; }
.cropHandle--s { left: calc(50% - 5px); bottom: -5px; }
.cropHandle--sw { left: -5px; bottom: -5px; }
.cropHandle--w { left: -5px; top: calc(50% - 5px); }
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
.btn.secondary.small.active {
  background: #4F3DFF;
  color: #fff;
}
</style>
