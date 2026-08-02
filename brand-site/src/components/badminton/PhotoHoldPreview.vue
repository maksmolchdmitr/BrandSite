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
  <Teleport to="body">
    <div
      v-if="open"
      class="photoHoldOverlay"
      role="dialog"
      aria-modal="true"
      @click="close"
      @wheel.prevent
      @touchmove.prevent
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
      prevBodyOverflow: "",
      prevHtmlOverflow: "",
      scrollLocked: false,
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
      this.lockScroll();
      document.addEventListener("keydown", this.onKeydown);
    },
    close() {
      if (!this.open) return;
      this.open = false;
      this.unlockScroll();
      document.removeEventListener("keydown", this.onKeydown);
    },
    onKeydown(e) {
      if (e.key === "Escape") this.close();
    },
    lockScroll() {
      if (this.scrollLocked) return;
      this.scrollLocked = true;
      this.prevBodyOverflow = document.body.style.overflow;
      this.prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.addEventListener("touchmove", this.preventScroll, { passive: false });
      document.addEventListener("wheel", this.preventScroll, { passive: false });
    },
    unlockScroll() {
      if (!this.scrollLocked) return;
      this.scrollLocked = false;
      document.body.style.overflow = this.prevBodyOverflow;
      document.documentElement.style.overflow = this.prevHtmlOverflow;
      document.removeEventListener("touchmove", this.preventScroll);
      document.removeEventListener("wheel", this.preventScroll);
    },
    preventScroll(e) {
      e.preventDefault();
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
    this.unlockScroll();
    document.removeEventListener("keydown", this.onKeydown);
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
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.88);
  cursor: zoom-out;
  touch-action: none;
  overscroll-behavior: none;
}
.photoHoldFull {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  -webkit-user-select: none;
  user-select: none;
  pointer-events: none;
}
</style>
