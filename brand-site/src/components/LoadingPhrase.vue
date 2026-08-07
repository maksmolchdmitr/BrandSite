<template>
  <span class="loadingPhrase">{{ base }}<span class="loadingPhrase-dots" aria-hidden="true">{{ dots }}</span></span>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "LoadingPhrase",
  props: {
    text: { type: String, required: true },
  },
  data() {
    return { step: 1 };
  },
  computed: {
    base() {
      return String(this.text || "").replace(/(?:\u2026|\.+)$/u, "");
    },
    dots() {
      return ".".repeat(this.step);
    },
  },
  mounted() {
    this._timer = setInterval(() => {
      this.step = this.step >= 3 ? 1 : this.step + 1;
    }, 400);
  },
  beforeUnmount() {
    clearInterval(this._timer);
  },
});
</script>

<style scoped>
.loadingPhrase-dots {
  display: inline-block;
  min-width: 1.25em;
  text-align: left;
}
</style>
