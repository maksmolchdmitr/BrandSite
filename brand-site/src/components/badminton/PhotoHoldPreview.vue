<template>
  <span class="photoCropFrame" :style="frameStyle">
    <img
      ref="source"
      v-bind="$attrs"
      :src="src"
      :alt="alt"
      :style="imgStyle || undefined"
      referrerpolicy="no-referrer"
      class="photoHoldSource"
      :class="{ cropped: !!imgStyle }"
      draggable="false"
      @click.stop.prevent="openInNewTab"
      @contextmenu.prevent
      @dragstart.prevent
    />
  </span>
</template>

<script>
import { defineComponent } from "vue";
import { photoCropImgStyle } from "@/badminton/photoCrop.js";

export default defineComponent({
  name: "PhotoHoldPreview",
  inheritAttrs: false,
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: "" },
    photoCrop: { type: Object, default: null },
  },
  computed: {
    imgStyle() {
      return photoCropImgStyle(this.photoCrop);
    },
    frameStyle() {
      return this.imgStyle ? { position: "relative", overflow: "hidden", display: "inline-block" } : null;
    },
  },
  methods: {
    openInNewTab() {
      if (!this.src) return;
      const win = window.open(this.src, "_blank", "noopener,noreferrer");
      if (win) return;

      const a = document.createElement("a");
      a.href = this.src;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
  },
});
</script>

<style scoped>
.photoCropFrame {
  line-height: 0;
}
.photoHoldSource {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  cursor: zoom-in;
}
.photoHoldSource.cropped {
  cursor: zoom-in;
}
</style>
