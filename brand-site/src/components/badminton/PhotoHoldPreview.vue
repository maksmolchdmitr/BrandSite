<template>
  <img
    ref="source"
    v-bind="$attrs"
    :src="src"
    :alt="alt"
    referrerpolicy="no-referrer"
    class="photoHoldSource"
    draggable="false"
    @click.stop.prevent="openInNewTab"
    @contextmenu.prevent
    @dragstart.prevent
  />
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "PhotoHoldPreview",
  inheritAttrs: false,
  props: {
    src: { type: String, required: true },
    alt: { type: String, default: "" },
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
.photoHoldSource {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  cursor: zoom-in;
}
</style>
