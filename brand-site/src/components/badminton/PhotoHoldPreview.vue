<template>
  <img
    ref="source"
    v-bind="$attrs"
    :src="src"
    :alt="alt"
    referrerpolicy="no-referrer"
    class="photoHoldSource"
    :class="{ photoHoldSourcePressing: pressing }"
    draggable="false"
    @pointerdown="onPointerDown"
    @contextmenu.prevent
    @dragstart.prevent
  />
  <Teleport v-if="open" to="body">
    <div
      class="photoHoldOverlay"
      role="dialog"
      aria-modal="true"
      @pointerup="onOverlayDismiss"
      @click="onOverlayDismiss"
    >
      <img
        :src="src"
        :alt="alt"
        class="photoHoldFull"
        referrerpolicy="no-referrer"
        draggable="false"
      />
    </div>
  </Teleport>
</template>

<script>
import { defineComponent } from "vue";

const HOLD_MS = 350;
/** OS touch slop / finger jitter — smaller values cancelled real holds on phones. */
const MOVE_CANCEL_PX = 28;
/** Ignore dismiss from the same gesture that opened the overlay. */
const STICKY_GUARD_MS = 450;

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
      ignoreDismissUntil: 0,
      startX: 0,
      startY: 0,
      activePointerId: null,
      swallowClickUntil: 0,
    };
  },
  methods: {
    onPointerDown(e) {
      if (!this.src) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      e.stopPropagation();

      this.cancelHold();
      this.pressing = true;
      this.activePointerId = e.pointerId;
      this.startX = e.clientX;
      this.startY = e.clientY;

      try {
        this.$refs.source?.setPointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }

      window.addEventListener("pointermove", this.onPointerMove, { passive: true });
      window.addEventListener("pointerup", this.onPointerEnd);
      window.addEventListener("pointercancel", this.onPointerEnd);

      this.holdTimer = window.setTimeout(() => {
        this.holdTimer = null;
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
    onPointerEnd(e) {
      if (this.activePointerId != null && e.pointerId !== this.activePointerId) return;
      const wasOpen = this.open;
      this.releaseCapture(e.pointerId);
      this.cancelHold();

      if (!wasOpen) return;

      // Sticky for every pointer type: stay open until overlay tap / Esc.
      this.ignoreDismissUntil = Date.now() + STICKY_GUARD_MS;
      this.armClickSwallow();
    },
    onOverlayDismiss(e) {
      if (!this.open) return;
      if (Date.now() < this.ignoreDismissUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this.close();
    },
    openLightbox() {
      if (this.open) return;
      // Block dismiss until the opening finger/mouse lifts.
      this.ignoreDismissUntil = Number.POSITIVE_INFINITY;
      this.open = true;
      this.armClickSwallow();
      document.addEventListener("keydown", this.onKeydown);
    },
    close() {
      if (!this.open) return;
      this.open = false;
      this.ignoreDismissUntil = 0;
      document.removeEventListener("keydown", this.onKeydown);
    },
    onKeydown(e) {
      if (e.key === "Escape") this.close();
    },
    armClickSwallow() {
      // Parent buttons (e.g. mock login) must not fire after a successful hold.
      this.swallowClickUntil = Date.now() + STICKY_GUARD_MS;
      document.addEventListener("click", this.swallowClick, true);
      window.setTimeout(() => {
        document.removeEventListener("click", this.swallowClick, true);
      }, STICKY_GUARD_MS + 50);
    },
    swallowClick(e) {
      if (Date.now() > this.swallowClickUntil) {
        document.removeEventListener("click", this.swallowClick, true);
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    },
    releaseCapture(pointerId) {
      try {
        if (pointerId != null && this.$refs.source?.hasPointerCapture?.(pointerId)) {
          this.$refs.source.releasePointerCapture(pointerId);
        }
      } catch {
        /* ignore */
      }
    },
    cancelHold() {
      if (this.holdTimer != null) {
        clearTimeout(this.holdTimer);
        this.holdTimer = null;
      }
      this.pressing = false;
      this.activePointerId = null;
      window.removeEventListener("pointermove", this.onPointerMove);
      window.removeEventListener("pointerup", this.onPointerEnd);
      window.removeEventListener("pointercancel", this.onPointerEnd);
    },
  },
  beforeUnmount() {
    this.cancelHold();
    this.close();
    document.removeEventListener("click", this.swallowClick, true);
  },
});
</script>

<style scoped>
.photoHoldSource {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  /* Must be none from the start — toggling on press is too late for the browser. */
  touch-action: none;
  cursor: zoom-in;
}
.photoHoldSourcePressing {
  opacity: 0.85;
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
