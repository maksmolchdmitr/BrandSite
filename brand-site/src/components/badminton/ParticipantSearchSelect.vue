<template>
  <div class="participantSearch">
    <input
      ref="input"
      class="input"
      type="search"
      enterkeyhint="search"
      inputmode="search"
      :value="query"
      :placeholder="placeholder"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      @input="onQueryInput"
      @focus="onFocus"
    />
    <div v-show="dropdownOpen" class="dropdown">
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
          :username="p.username || ''"
        />
      </div>
      <div
        v-if="!loading && items.length === 0 && query.trim()"
        class="dropdownItem muted"
      >
        {{ $t("badminton.group.noParticipants") }}
      </div>
      <div v-if="showPager" class="dropdownPager">
        <button
          type="button"
          class="pagerButton"
          :disabled="!canGoPrev || loading"
          @mousedown.prevent
          @click.stop="goPrev"
        >
          ←
        </button>
        <span class="pagerPage">{{ $t("common.pager.page", { page: pageIndex + 1 }) }}</span>
        <button
          type="button"
          class="pagerButton"
          :disabled="!canGoNext || loading"
          @mousedown.prevent
          @click.stop="goNext"
        >
          →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import PersonChip from "@/components/badminton/PersonChip.vue";
import { badmintonClient } from "@/badminton/client.js";

const PAGE_LIMIT = 10;

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
      pages: [],
      pageIndex: 0,
      loading: false,
      open: false,
      searchTimer: null,
      openTimer: null,
      requestSeq: 0,
    };
  },
  computed: {
    currentPage() {
      return this.pages[this.pageIndex] || { items: [], pageToken: null };
    },
    items() {
      const exclude = new Set((this.excludeIds || []).filter(Boolean));
      return (this.currentPage.items || []).filter((p) => !exclude.has(p.id));
    },
    dropdownOpen() {
      return this.open && (this.loading || this.items.length > 0 || Boolean(this.query.trim()) || this.pages.length > 0);
    },
    canGoPrev() {
      return this.pageIndex > 0;
    },
    canGoNext() {
      return Boolean(this.currentPage?.pageToken);
    },
    showPager() {
      return this.pages.length > 0 && (this.canGoPrev || this.canGoNext);
    },
  },
  beforeUnmount() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (this.openTimer) clearTimeout(this.openTimer);
  },
  methods: {
    reset() {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      if (this.openTimer) clearTimeout(this.openTimer);
      this.query = "";
      this.pages = [];
      this.pageIndex = 0;
      this.loading = false;
      this.open = false;
    },
    onFocus() {
      // Defer list open: mounting/showing the dropdown in the same tick as focus
      // often blocks the mobile keyboard (iOS / Telegram WebView) until a 2nd tap.
      if (this.openTimer) clearTimeout(this.openTimer);
      // Let the keyboard attach from the user focus gesture first (iOS / Telegram WebView).
      this.openTimer = setTimeout(() => {
        this.open = true;
        if (this.pages.length === 0 && !this.loading) {
          this.loadFirstPage();
        }
        this.$nextTick(() => {
          const input = this.$refs.input;
          if (input && document.activeElement !== input) {
            input.focus({ preventScroll: true });
          }
        });
      }, 50);
    },
    onQueryInput(event) {
      this.query = event.target.value;
      this.open = true;
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        this.loadFirstPage();
      }, 200);
    },
    async loadFirstPage() {
      this.pages = [];
      this.pageIndex = 0;
      await this.fetchPage({ pageToken: undefined, replace: true });
    },
    async fetchPage({ pageToken, replace }) {
      if (!this.groupId) return;
      const seq = ++this.requestSeq;
      this.loading = true;
      try {
        const result = await badmintonClient.searchParticipants(this.groupId, {
          query: this.query.trim(),
          limit: PAGE_LIMIT,
          pageToken,
        });
        if (seq !== this.requestSeq) return;
        const page = {
          items: result?.items || [],
          pageToken: result?.pageToken || null,
          pageTokenFrom: pageToken || null,
        };
        if (replace) {
          this.pages = [page];
          this.pageIndex = 0;
        } else {
          this.pages.push(page);
          this.pageIndex = this.pages.length - 1;
        }
      } catch (e) {
        if (seq !== this.requestSeq) return;
        console.error("Failed to load participants:", e);
        if (replace) {
          this.pages = [{ items: [], pageToken: null, pageTokenFrom: null }];
          this.pageIndex = 0;
        }
      } finally {
        if (seq === this.requestSeq) this.loading = false;
      }
    },
    goPrev() {
      if (!this.canGoPrev || this.loading) return;
      this.pageIndex -= 1;
    },
    async goNext() {
      if (!this.canGoNext || this.loading) return;
      const nextToken = this.currentPage.pageToken;
      if (!nextToken) return;
      const existingIndex = this.pages.findIndex(
        (p, idx) => idx > this.pageIndex && p.pageTokenFrom === nextToken
      );
      if (existingIndex >= 0) {
        this.pageIndex = existingIndex;
        return;
      }
      // Drop forward cache when branching from an earlier page
      this.pages = this.pages.slice(0, this.pageIndex + 1);
      await this.fetchPage({ pageToken: nextToken, replace: false });
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
.dropdownPager {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-top: 1px solid #e0e0ff;
  position: sticky;
  bottom: 0;
  background: white;
}
.pagerButton {
  border: 2px solid #4f3dff;
  background-color: white;
  border-radius: 999px;
  padding: 6px 14px;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: #4f3dff;
  cursor: pointer;
}
.pagerButton:disabled {
  opacity: 0.5;
  cursor: default;
}
.pagerPage {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: #4f3dff;
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
  .dropdown,
  .dropdownPager {
    background: #2d2d2d;
    border-color: #4a4a4a;
  }
  .dropdownItem:hover {
    background: #3a3a3a;
  }
  .pagerButton {
    background-color: #2d2d2d;
    color: #c7bcff;
    border-color: #6f62c6;
  }
  .pagerPage {
    color: #c7bcff;
  }
}
</style>
