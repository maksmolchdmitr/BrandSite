<template>
  <div ref="root" class="participantSearch">
    <input
      ref="input"
      class="input"
      type="text"
      inputmode="search"
      enterkeyhint="search"
      :readonly="!typingEnabled"
      :value="query"
      :placeholder="placeholder"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      @pointerdown="onPointerDown"
      @input="onQueryInput"
      @focus="onFocus"
    />
    <div
      v-show="dropdownOpen"
      ref="dropdown"
      class="dropdown"
      @scroll.passive="onDropdownScroll"
    >
      <div v-if="loading && items.length === 0" class="dropdownItem muted">
        <LoadingPhrase :text="$t('common.actions.loading')" />
      </div>
      <div
        v-for="p in items"
        :key="p.id"
        class="dropdownItem"
        @mousedown.prevent
        @click="onSelect(p)"
      >
        <PersonChip
          :name="p.name"
          :photo-url="p.photoUrl || ''"
          :photo-crop="p.photoCrop || null"
          :username="p.username || ''"
        />
      </div>
      <div
        v-if="!loading && items.length === 0 && query.trim()"
        class="dropdownItem muted"
      >
        {{ $t("badminton.group.noParticipants") }}
      </div>
      <div v-if="loadingMore" class="dropdownItem muted">
        <LoadingPhrase :text="$t('common.actions.loading')" />
      </div>
      <div v-if="canLoadMore" ref="scrollSentinel" class="scrollSentinel" aria-hidden="true" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import PersonChip from "@/components/badminton/PersonChip.vue";
import { badmintonClient } from "@/badminton/client.js";

const PAGE_LIMIT = 10;
const SCROLL_LOAD_THRESHOLD_PX = 48;

function isTouchPointer(event) {
  return event?.pointerType === "touch" || event?.pointerType === "pen";
}

export default defineComponent({
  name: "ParticipantSearchSelect",
  components: { PersonChip },
  props: {
    groupId: { type: String, required: true },
    placeholder: { type: String, default: "" },
    /** Participant ids already picked for other slots — excluded from results */
    excludeIds: { type: Array, default: () => [] },
  },
  emits: ["select"],
  data() {
    return {
      query: "",
      rawItems: [],
      nextPageToken: null,
      loading: false,
      loadingMore: false,
      open: false,
      typingEnabled: true,
      touchOpenPending: false,
      searchTimer: null,
      requestSeq: 0,
      scrollObserver: null,
    };
  },
  computed: {
    items() {
      const exclude = new Set((this.excludeIds || []).filter(Boolean));
      return (this.rawItems || []).filter((p) => !exclude.has(p.id));
    },
    dropdownOpen() {
      return this.open && (
        this.loading
        || this.loadingMore
        || this.items.length > 0
        || Boolean(this.query.trim())
        || this.rawItems.length > 0
      );
    },
    canLoadMore() {
      return Boolean(this.nextPageToken) && !this.loading;
    },
  },
  watch: {
    dropdownOpen(isOpen) {
      if (isOpen) {
        this.$nextTick(() => this.setupScrollObserver());
      } else {
        this.teardownScrollObserver();
      }
    },
    canLoadMore(can) {
      if (can && this.dropdownOpen) {
        this.$nextTick(() => this.setupScrollObserver());
      }
    },
  },
  mounted() {
    document.addEventListener("pointerdown", this.onDocPointerDown, true);
  },
  beforeUnmount() {
    document.removeEventListener("pointerdown", this.onDocPointerDown, true);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.teardownScrollObserver();
  },
  methods: {
    onDocPointerDown(event) {
      if (!this.open) return;
      const root = this.$refs.root;
      if (root && !root.contains(event.target)) {
        this.open = false;
        this.typingEnabled = true;
        this.touchOpenPending = false;
      }
    },
    reset() {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.teardownScrollObserver();
      this.query = "";
      this.rawItems = [];
      this.nextPageToken = null;
      this.loading = false;
      this.loadingMore = false;
      this.open = false;
      this.typingEnabled = true;
      this.touchOpenPending = false;
    },
    onPointerDown(event) {
      if (!isTouchPointer(event)) return;
      if (!this.open) {
        this.touchOpenPending = true;
        this.typingEnabled = false;
        return;
      }
      if (!this.typingEnabled) {
        this.typingEnabled = true;
      }
    },
    onFocus() {
      const fromTouchOpen = this.touchOpenPending;
      this.touchOpenPending = false;
      if (!this.open) {
        this.open = true;
        this.typingEnabled = !fromTouchOpen;
      }
      if (this.rawItems.length === 0 && !this.loading) {
        this.reload();
      }
      if (fromTouchOpen && !this.typingEnabled) {
        this.$nextTick(() => {
          if (!this.typingEnabled) {
            this.$refs.input?.blur();
          }
        });
      }
    },
    onQueryInput(event) {
      this.typingEnabled = true;
      this.query = event.target.value;
      this.open = true;
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.reload();
      }, 200);
    },
    onDropdownScroll() {
      const el = this.$refs.dropdown;
      if (!el || !this.canLoadMore || this.loadingMore) return;
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (remaining <= SCROLL_LOAD_THRESHOLD_PX) {
        this.loadMore();
      }
    },
    setupScrollObserver() {
      this.teardownScrollObserver();
      const root = this.$refs.dropdown;
      const sentinel = this.$refs.scrollSentinel;
      if (!root || !sentinel || typeof IntersectionObserver === "undefined") return;
      this.scrollObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            this.loadMore();
          }
        },
        { root, rootMargin: "0px 0px 48px 0px", threshold: 0 }
      );
      this.scrollObserver.observe(sentinel);
    },
    teardownScrollObserver() {
      if (this.scrollObserver) {
        this.scrollObserver.disconnect();
        this.scrollObserver = null;
      }
    },
    async reload() {
      this.rawItems = [];
      this.nextPageToken = null;
      await this.fetchPage({ pageToken: undefined, append: false });
      this.$nextTick(() => {
        const el = this.$refs.dropdown;
        if (el) el.scrollTop = 0;
        this.setupScrollObserver();
      });
    },
    async loadMore() {
      if (!this.canLoadMore || this.loadingMore || this.loading) return;
      await this.fetchPage({ pageToken: this.nextPageToken, append: true });
      this.$nextTick(() => this.setupScrollObserver());
    },
    async fetchPage({ pageToken, append }) {
      if (!this.groupId) return;
      const seq = ++this.requestSeq;
      if (append) {
        this.loadingMore = true;
      } else {
        this.loading = true;
      }
      try {
        const result = await badmintonClient.searchParticipants(this.groupId, {
          query: this.query.trim(),
          limit: PAGE_LIMIT,
          pageToken,
        });
        if (seq !== this.requestSeq) return;
        const pageItems = result?.items || [];
        this.rawItems = append ? [...this.rawItems, ...pageItems] : pageItems;
        this.nextPageToken = result?.pageToken || null;
      } catch (e) {
        if (seq !== this.requestSeq) return;
        console.error("Failed to load participants:", e);
        if (!append) {
          this.rawItems = [];
          this.nextPageToken = null;
        }
      } finally {
        if (seq === this.requestSeq) {
          this.loading = false;
          this.loadingMore = false;
        }
      }
    },
    onSelect(participant) {
      this.$emit("select", participant);
      this.reset();
    },
  },
});
</script>

<style scoped>
.participantSearch {
  position: relative;
  width: 100%;
  min-width: 0;
}
.input {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #ddd;
  font-family: var(--font-display);
  font-size: 16px;
  background: white;
  color: inherit;
}
.input:focus {
  outline: none;
  border-color: #4f3dff;
  box-shadow: 0 0 0 3px rgba(79, 61, 255, 0.15);
}
.input:read-only {
  caret-color: transparent;
}
.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e0e0ff;
  border-radius: 12px;
  margin-top: 4px;
  max-height: 320px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(79, 61, 255, 0.12);
}
.dropdownItem {
  padding: 10px 14px;
  cursor: pointer;
  font-family: var(--font-display);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dropdownItem:hover {
  background: #f6f6ff;
}
.dropdownItem.muted {
  cursor: default;
  opacity: 0.7;
}
.dropdownItem.muted:hover {
  background: transparent;
}
.scrollSentinel {
  height: 1px;
  width: 100%;
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .input {
    background: #242424;
    border-color: #4a4a4a;
    color: #e8e8e8;
  }
  .input:focus {
    border-color: #4f3dff;
    box-shadow: 0 0 0 3px rgba(79, 61, 255, 0.25);
  }
  .dropdown {
    background: #2d2d2d;
    border-color: #4a4a4a;
  }
  .dropdownItem:hover {
    background: #3a3a3a;
  }
}
</style>
