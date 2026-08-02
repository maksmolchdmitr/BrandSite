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
</template>

<script>
import { defineComponent } from "vue";

const HOLD_MS = 350;
/** OS touch slop / finger jitter — smaller values cancelled real holds on phones. */
const MOVE_CANCEL_PX = 28;
/** Swallow parent clicks after a successful hold. */
const CLICK_SWALLOW_MS = 450;

export default defineComponent({
  name: "PhotoHoldPreview",
  inheritAttrs: false,
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: "" },
  },
  data() {
    return {
      pressing: false,
      holdTimer: null,
      startX: 0,
      startY: 0,
      activePointerId: null,
      swallowClickUntil: 0,
      opened: false,
    };
  },
  methods: {
    onPointerDown(e) {
      if (!this.src) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      e.stopPropagation();

      this.cancelHold();
      this.opened = false;
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
        this.openInNewTab();
      }, HOLD_MS);
    },
    onPointerMove(e) {
      if (this.activePointerId !== e.pointerId || this.opened) return;
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
        this.cancelHold();
      }
    },
    onPointerEnd(e) {
      if (this.activePointerId != null && e.pointerId !== this.activePointerId) return;
      this.releaseCapture(e.pointerId);
      this.cancelHold();
    },
    openInNewTab() {
      if (!this.src || this.opened) return;
      this.opened = true;
      this.armClickSwallow();

      const win = window.open(this.src, "_blank", "noopener,noreferrer");
      if (win) return;

      // Popup blocked — programmatic <a> click is more reliable than location.assign.
      const a = document.createElement("a");
      a.href = this.src;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    armClickSwallow() {
      this.swallowClickUntil = Date.now() + CLICK_SWALLOW_MS;
      document.addEventListener("click", this.swallowClick, true);
      window.setTimeout(() => {
        document.removeEventListener("click", this.swallowClick, true);
      }, CLICK_SWALLOW_MS + 50);
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
