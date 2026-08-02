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
    @click.stop.prevent
    @contextmenu.prevent
    @dragstart.prevent
  />
  <!--
    Teleport to <body>: overlay must NOT rely on scoped CSS (Vue data-v on
    teleported nodes does not match parent scoped selectors; class-only rules
    can still lose to build/order surprises). Critical layout is inline.
  -->
  <Teleport to="body">
    <div
      v-if="open"
      class="bmt-photo-hold-overlay"
      role="dialog"
      aria-modal="true"
      :style="overlayStyle"
      @pointerup="onOverlayDismiss"
      @click="onOverlayDismiss"
    >
      <img
        :src="src"
        :alt="alt"
        class="bmt-photo-hold-full"
        :style="fullStyle"
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

/** Inline — survives Teleport + any scoped/CSS-order issues. */
const OVERLAY_STYLE = {
  position: "fixed",
  top: "0",
  right: "0",
  bottom: "0",
  left: "0",
  width: "100vw",
  height: "100vh",
  maxWidth: "100vw",
  maxHeight: "100vh",
  margin: "0",
  zIndex: "2147483646",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
  boxSizing: "border-box",
  background: "rgba(0, 0, 0, 0.94)",
  cursor: "zoom-out",
  transform: "none",
  filter: "none",
  inset: "0",
};

const FULL_STYLE = {
  display: "block",
  width: "min(92vw, 720px)",
  maxWidth: "92vw",
  maxHeight: "85vh",
  height: "auto",
  objectFit: "contain",
  borderRadius: "4px",
  pointerEvents: "none",
  userSelect: "none",
  transform: "none",
};

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
      overlayStyle: OVERLAY_STYLE,
      fullStyle: FULL_STYLE,
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

<!-- Unscoped backup for teleported nodes (class names are global on purpose). -->
<style>
.bmt-photo-hold-overlay {
  position: fixed !important;
  inset: 0 !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  height: 100dvh !important;
  max-width: 100vw !important;
  max-height: 100dvh !important;
  margin: 0 !important;
  z-index: 2147483646 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-sizing: border-box !important;
  background: rgba(0, 0, 0, 0.94) !important;
  cursor: zoom-out !important;
  transform: none !important;
  filter: none !important;
}
.bmt-photo-hold-full {
  display: block !important;
  width: min(92vw, 720px) !important;
  max-width: 92vw !important;
  max-height: 85vh !important;
  max-height: 85dvh !important;
  height: auto !important;
  object-fit: contain !important;
  border-radius: 4px !important;
  -webkit-user-select: none !important;
  user-select: none !important;
  pointer-events: none !important;
  transform: none !important;
}
</style>
