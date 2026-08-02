<template>
  <img
    v-bind="$attrs"
    :src="src"
    :alt="alt"
    referrerpolicy="no-referrer"
    class="photoHoldSource"
    draggable="false"
    @pointerdown="onPointerDown"
    @click="onClick"
    @contextmenu.prevent
    @dragstart.prevent
  />
  <Teleport v-if="open" to="body">
    <div
      class="photoHoldOverlay"
      role="dialog"
      aria-modal="true"
      @click="close"
    >
      <img
        :src="src"
        :alt="alt"
        class="photoHoldFull"
        referrerpolicy="no-referrer"
        draggable="false"
        @click.stop
      />
    </div>
  </Teleport>
</template>

<script>
import { defineComponent } from "vue";

const HOLD_MS = 350;
const MOVE_CANCEL_PX = 10;

export default defineComponent({
  name: "PhotoHoldPreview",
  inheritAttrs: false,
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: "" },
  },
  data() {
    return {
      open: false,
      holdTimer: null,
      suppressClick: false,
      startX: 0,
      startY: 0,
      activePointerId: null,
    };
  },
  methods: {
    onPointerDown(e) {
      if (!this.src) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      this.cancelHold();
      this.activePointerId = e.pointerId;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.suppressClick = false;

      window.addEventListener("pointermove", this.onPointerMove);
      window.addEventListener("pointerup", this.onPointerUp);
      window.addEventListener("pointercancel", this.onPointerUp);

      this.holdTimer = window.setTimeout(() => {
        this.holdTimer = null;
        this.suppressClick = true;
        this.openLightbox();
      }, HOLD_MS);
    },
    onPointerMove(e) {
      if (this.activePointerId !== e.pointerId || this.open) return;
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
        this.cancelHold();
      }
    },
    onPointerUp(e) {
      if (this.activePointerId != null && e.pointerId !== this.activePointerId) return;
      const wasOpen = this.open;
      this.cancelHold();
      if (wasOpen) this.close();
    },
    onClick(e) {
      if (!this.suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
      this.suppressClick = false;
    },
    openLightbox() {
      if (this.open) return;
      this.open = true;
      document.addEventListener("keydown", this.onKeydown);
    },
    close() {
      if (!this.open) return;
      this.open = false;
      document.removeEventListener("keydown", this.onKeydown);
    },
    onKeydown(e) {
      if (e.key === "Escape") this.close();
    },
    cancelHold() {
      if (this.holdTimer != null) {
        clearTimeout(this.holdTimer);
        this.holdTimer = null;
      }
      this.activePointerId = null;
      window.removeEventListener("pointermove", this.onPointerMove);
      window.removeEventListener("pointerup", this.onPointerUp);
      window.removeEventListener("pointercancel", this.onPointerUp);
    },
  },
  beforeUnmount() {
    this.cancelHold();
    this.close();
  },
});
</script>

<style scoped>
.photoHoldSource {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;
  cursor: zoom-in;
}
</style>

<style>
.photoHoldOverlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.88);
  cursor: zoom-out;
}
.photoHoldFull {
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  max-height: calc(100dvh - 32px);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  -webkit-user-select: none;
  user-select: none;
  pointer-events: none;
}
</style>
