<template>
  <img
    v-bind="$attrs"
    :src="src"
    :alt="alt"
    referrerpolicy="no-referrer"
    class="photoHoldSource"
    :class="{ photoHoldSourcePressing: pressing }"
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
      @click="onOverlayClick"
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
/** After the opening finger lifts, ignore overlay click briefly (synthetic click). */
const STICKY_GUARD_MS = 300;

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
      pressing: false,
      holdTimer: null,
      suppressClick: false,
      /** Touch/pen: stay open until overlay tap / Esc. Mouse: release closes. */
      stickyOpen: false,
      ignoreOverlayCloseUntil: 0,
      startX: 0,
      startY: 0,
      activePointerId: null,
      activePointerType: null,
    };
  },
  methods: {
    onPointerDown(e) {
      if (!this.src) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      this.cancelHold();
      this.pressing = true;
      this.activePointerId = e.pointerId;
      this.activePointerType = e.pointerType || "mouse";
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.suppressClick = false;

      window.addEventListener("pointermove", this.onPointerMove);
      window.addEventListener("pointerup", this.onPointerUp);
      window.addEventListener("pointercancel", this.onPointerUp);

      this.holdTimer = window.setTimeout(() => {
        this.holdTimer = null;
        this.suppressClick = true;
        this.openLightbox(this.activePointerType);
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
      const pointerType = e.pointerType || this.activePointerType;
      this.cancelHold();

      if (!wasOpen) return;

      if (pointerType === "mouse") {
        // Desktop: hold-to-preview / release-to-close
        this.close();
        return;
      }

      // Touch/pen sticky: arm dismiss only after this finger lifts, then guard
      // against the synthetic click from the same gesture.
      this.ignoreOverlayCloseUntil = Date.now() + STICKY_GUARD_MS;
    },
    onClick(e) {
      if (!this.suppressClick) return;
      e.preventDefault();
      e.stopPropagation();
      this.suppressClick = false;
    },
    onOverlayClick(e) {
      if (!this.open) return;
      if (this.stickyOpen && Date.now() < this.ignoreOverlayCloseUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.close();
    },
    openLightbox(pointerType) {
      if (this.open) return;
      this.stickyOpen = pointerType !== "mouse";
      // Block overlay dismiss until the opening finger lifts (see onPointerUp).
      this.ignoreOverlayCloseUntil = this.stickyOpen ? Number.POSITIVE_INFINITY : 0;
      this.open = true;
      document.addEventListener("keydown", this.onKeydown);
    },
    close() {
      if (!this.open) return;
      this.open = false;
      this.stickyOpen = false;
      this.ignoreOverlayCloseUntil = 0;
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
      this.pressing = false;
      this.activePointerId = null;
      this.activePointerType = null;
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
.photoHoldSourcePressing {
  touch-action: none;
}
</style>

<style>
.photoHoldOverlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  max-height: 100dvh;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding:
    max(16px, env(safe-area-inset-top, 0px))
    max(16px, env(safe-area-inset-right, 0px))
    max(16px, env(safe-area-inset-bottom, 0px))
    max(16px, env(safe-area-inset-left, 0px));
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.88);
  cursor: zoom-out;
  transform: none;
}
.photoHoldFull {
  display: block;
  max-width: min(100vw, 100%);
  max-height: min(100dvh, 100%);
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  -webkit-user-select: none;
  user-select: none;
  pointer-events: none;
  transform: none;
}
</style>
