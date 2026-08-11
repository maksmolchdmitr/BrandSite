<template>
  <div class="page">
    <div class="content">
      <div v-if="error" class="errorBox">{{ error }}</div>

      <div class="widgetBox">
        <div class="widgetTitle">{{ $t('badminton.login.telegramTitle') }}</div>
        <button type="button" class="btn telegramBtn" :disabled="loading" @click="goToTelegramOAuth">
          {{ $t('badminton.login.telegramButton') }}
        </button>
        <div class="widgetHint">
          {{ $t('badminton.login.telegramHint') }}
        </div>
      </div>

      <div v-if="showMockUsers" class="usersBox">
        <div class="widgetTitle">{{ $t('badminton.login.mockUsers') }}</div>
        <div class="usersGrid">
          <button v-for="u in users" :key="u.id" class="userBtn" :disabled="loading" @click="loginAs(u.id)">
            <PersonChip
              :name="[u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.id"
              :photo-url="u.photoUrl"
              :photo-crop="u.photoCrop || null"
              :username="u.username"
            />
            <div class="userMeta">{{ $t('badminton.login.telegramShort') }}: {{ u.telegramId }}</div>
          </button>
        </div>
        <div class="widgetHint">{{ $t('badminton.login.mockHint') }}</div>
      </div>

      <div class="row">
        <button class="btn secondary" :disabled="loading" @click="logout">
          {{ $t('badminton.login.logoutClear') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import PersonChip from "@/components/badminton/PersonChip.vue";
import {badmintonClient, clearMockSession} from "@/badminton/client.js";
import {mockClient} from "@/badminton/mockClient.js";
import {getLoggedInUserId} from "@/badminton/cookies.js";
import {BADMINTON_DEBUG, SHOW_MOCK_USERS, buildTelegramOAuthUrl, hasAppSession, markTgAutoLoginTried, wasTgAutoLoginTried, clearTgAutoLoginTried, resetReauthGuard} from "@/badminton/apiHelpers.js";

let telegramPopupRef = null;

function tgLog(...args) {
  if (BADMINTON_DEBUG) console.log("[TG Auth]", ...args);
}

export default defineComponent({
  components: {PersonChip},
  props: {
    userId: {
      type: String,
      default: null
    }
  },
  async mounted() {
    resetReauthGuard();
    this.setupTelegramCallback();
    const fromCallback = this.parseTelegramCallbackFromUrl();
    try {
      if (badmintonClient.listMockUsers) {
        this.users = await badmintonClient.listMockUsers();
      } else if (SHOW_MOCK_USERS && mockClient.listMockUsers) {
        this.users = await mockClient.listMockUsers();
      }
    } catch (e) {
      console.warn("Failed to load mock users:", e);
    }
    if (this.userId) {
      await this.loginAs(this.userId);
      return;
    }
    if (!fromCallback) {
      this.maybeAutoTelegramLogin();
    }
  },
  beforeUnmount() {
    if (this.telegramMessageHandler) {
      window.removeEventListener("message", this.telegramMessageHandler);
    }
    if (telegramPopupRef) try { telegramPopupRef.close(); } catch (_) {}
    telegramPopupRef = null;
  },
  data() {
    return {
      loading: false,
      error: "",
      users: [],
      telegramAuthProcessed: false,
    };
  },
  computed: {
    // Блок мок-юзеров: при USE_MOCKS=true список от badmintonClient; при реальном API — от mockClient, если SHOW_MOCK_USERS
    showMockUsers() {
      if (!SHOW_MOCK_USERS) return false;
      return typeof badmintonClient.listMockUsers === "function" || typeof mockClient.listMockUsers === "function";
    },
  },
  methods: {
    stripAutoTgQuery() {
      const q = this.$route?.query || {};
      if (q.autoTg == null) return;
      const next = { ...q };
      delete next.autoTg;
      this.$router.replace({ query: next }).catch(() => {});
    },
    maybeAutoTelegramLogin() {
      if (typeof window === "undefined") return;
      if (hasAppSession()) {
        this.stripAutoTgQuery();
        return;
      }
      const autoTg = this.$route?.query?.autoTg;
      const wantAuto = autoTg === "1" || autoTg === "true";
      if (!wantAuto) return;
      if (wasTgAutoLoginTried()) {
        tgLog("auto TG skipped — already tried this tab session");
        this.stripAutoTgQuery();
        return;
      }
      const origin = window.location.origin;
      if (!origin) return;
      markTgAutoLoginTried();
      this.stripAutoTgQuery();
      this.loading = true;
      const returnTo = `${origin}/?page=badminton&section=login`;
      const url = buildTelegramOAuthUrl({ returnTo });
      tgLog("auto TG: top-level OAuth redirect", url);
      window.location.assign(url);
    },
    goToTelegramOAuth() {
      clearTgAutoLoginTried();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = buildTelegramOAuthUrl();
      tgLog("1. Opening OAuth popup", { origin, url });
      if (!origin) {
        this.error = this.$t("badminton.login.errOrigin");
        return;
      }
      const winName = "tg_oauth_" + Date.now();
      const w = window.open(url, winName, "width=500,height=600,scrollbars=yes,resizable=yes");
      telegramPopupRef = w;
      tgLog("2. window.open:", !!w ? "ok" : "null (blocked?)", winName);
      if (!w) {
        window.location.assign(url);
        return;
      }
      if (BADMINTON_DEBUG) {
        setTimeout(() => {
          try { tgLog("3. After 800ms popup.closed =", w.closed); } catch (e) {}
        }, 800);
      }
    },
    parseTgAuthResultPayload(raw) {
      if (!raw || typeof raw !== "string") return null;
      const tryParse = (s) => {
        try {
          const o = JSON.parse(s);
          return o && typeof o === "object" ? o : null;
        } catch (_) {
          return null;
        }
      };
      let parsed = tryParse(raw);
      if (parsed) return parsed;
      try {
        parsed = tryParse(decodeURIComponent(raw));
        if (parsed) return parsed;
      } catch (_) {}
      try {
        parsed = tryParse(atob(raw.replace(/-/g, "+").replace(/_/g, "/")));
        if (parsed) return parsed;
      } catch (_) {}
      return null;
    },
    parseTelegramCallbackFromUrl() {
      if (this.telegramAuthProcessed) return false;
      const telegramParams = ["id", "first_name", "last_name", "username", "photo_url", "auth_date", "hash"];
      const fromQuery = (params) => {
        const o = {};
        telegramParams.forEach((p) => {
          if (params.has(p)) {
            const v = params.get(p);
            o[p] = p === "id" || p === "auth_date" ? (typeof v === "string" ? parseInt(v, 10) : v) : v;
          }
        });
        return o;
      };
      const acceptPayload = (payload, source) => {
        if (!payload || !("id" in payload) || !("hash" in payload)) return false;
        tgLog(`Callback from ${source}`, payload.id, payload.first_name);
        this.telegramAuthProcessed = true;
        this.handleTelegramAuth(payload);
        return true;
      };

      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.replace(/^#/, "");
        const hashParams = new URLSearchParams(hash);
        if (hashParams.has("tgAuthResult")) {
          const payload = this.parseTgAuthResultPayload(hashParams.get("tgAuthResult"));
          const result = payload?.result && typeof payload.result === "object" ? payload.result : payload;
          if (acceptPayload(result, "URL tgAuthResult")) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
            return true;
          }
        }
      }

      const query = new URLSearchParams(this.$route?.query || "");
      const hasQuery = telegramParams.some((p) => query.has(p));
      if (hasQuery && Object.keys(fromQuery(query)).length >= 3) {
        if (acceptPayload(fromQuery(query), "URL query")) return true;
      }
      if (typeof window === "undefined" || !window.location.hash) return false;
      const hash = window.location.hash.replace(/^#/, "");
      const hashParams = new URLSearchParams(hash);
      const hasHash = telegramParams.some((p) => hashParams.has(p));
      if (hasHash && !this.telegramAuthProcessed && Object.keys(fromQuery(hashParams)).length >= 3) {
        if (acceptPayload(fromQuery(hashParams), "URL hash")) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          return true;
        }
      }
      return false;
    },
    setupTelegramCallback() {
      const allowedOrigins = ["https://oauth.telegram.org", "https://t.me", "https://telegram.org"];
      this.telegramMessageHandler = (event) => {
        const fromTg = allowedOrigins.some((o) => event.origin === o || event.origin.startsWith(o + "/"));
        if (!fromTg) return;
        let data = event.data;
        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (e) {
            tgLog("postMessage from TG: data is string but not JSON", data?.substring?.(0, 80));
            return;
          }
        }
        if (!data || typeof data !== "object" || this.telegramAuthProcessed) {
          if (BADMINTON_DEBUG && data) tgLog("postMessage from TG skipped", typeof data, this.telegramAuthProcessed);
          return;
        }
        // Telegram может присылать { event, result, origin } — данные пользователя в result
        const payload = (data.result && typeof data.result === "object") ? data.result : data;
        const hasId = payload && "id" in payload && "hash" in payload;
        if (hasId) {
          tgLog("4. Valid Telegram data", payload.id, payload.first_name);
          this.telegramAuthProcessed = true;
          if (telegramPopupRef) try { telegramPopupRef.close(); } catch (_) {}
          telegramPopupRef = null;
          this.handleTelegramAuth(payload);
        } else {
          tgLog("postMessage from TG no id/hash", Object.keys(data || {}), payload ? Object.keys(payload) : "-");
        }
      };
      window.addEventListener("message", this.telegramMessageHandler, false);
      tgLog("0. postMessage listener added");
    },
    async handleTelegramAuth(telegramData) {
      tgLog("5. handleTelegramAuth", telegramData?.id, telegramData?.first_name);
      this.loading = true;
      this.error = "";
      try {
        clearTgAutoLoginTried();
        await badmintonClient.telegramLogin(telegramData);
        tgLog("6. telegramLogin OK");
        await new Promise((r) => setTimeout(r, 150));
        await this.$router.push("/?page=badminton&section=ratings");
      } catch (e) {
        tgLog("7. telegramLogin failed", e?.message);
        const msg = e?.message || "";
        if (msg === "Failed to fetch" || (msg && msg.includes("fetch"))) {
          this.error = this.$t("badminton.login.errNoServer");
        } else {
          this.error = msg || this.$t("badminton.login.errTelegram");
        }
      } finally {
        this.loading = false;
      }
    },
    async loginAs(userId) {
      this.loading = true;
      this.error = "";
      try {
        const useMockForLogin =
          typeof badmintonClient.listMockUsers !== "function";
        if (useMockForLogin) {
          sessionStorage.setItem("badminton.useMockSession", "1");
          await mockClient.loginAsUser(userId);
        } else {
          await badmintonClient.loginAsUser(userId);
        }
        const cookieUserId = getLoggedInUserId();
        if (!cookieUserId) {
          throw new Error("Cookie was not set after login");
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
        try {
          await this.$router.push("/?page=badminton&section=ratings");
        } catch (navError) {
          await this.$router.replace("/?page=badminton&section=ratings");
        }
      } catch (e) {
        console.error("Login error:", e);
        this.error = e?.message || this.$t("badminton.login.errLogin");
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      this.loading = true;
      this.error = "";
      try {
        await badmintonClient.logout();
        clearMockSession();
      } catch (e) {
        this.error = e?.message || this.$t("badminton.login.errLogout");
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 64px;
  max-width: 100%;
  box-sizing: border-box;
}

.content {
  padding: 24px 50px 50px 50px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  font-family: var(--font-display);
  font-size: 20px;
  max-width: 960px;
}

.row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  max-width: 100%;
  min-width: 0;
}

.btn {
  border: none;
  cursor: pointer;
  background-color: #4F3DFF;
  color: white;
  border-radius: 100px;
  padding: 14px 18px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
}

.btn:disabled {
  cursor: default;
  opacity: 0.7;
}

.btn.secondary {
  background-color: white;
  color: #4F3DFF;
  border: 2px solid #4F3DFF;
}

.errorBox {
  background: #ffe6e6;
  border: 1px solid #ffb3b3;
  padding: 12px 14px;
  border-radius: 12px;
  font-family: var(--font-display);
}

.widgetBox {
  margin-top: 6px;
  background: white;
  border-radius: 18px;
  padding: 16px;
  max-width: min(420px, 100%);
  box-sizing: border-box;
}

#telegram-login-widget {
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

#telegram-login-widget iframe {
  border: none;
}

.usersBox {
  margin-top: 6px;
  background: white;
  border-radius: 18px;
  padding: 16px;
}

.widgetTitle {
  font-family: var(--font-display);
  font-weight: 700;
  margin-bottom: 10px;
}

.usersGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.userBtn {
  cursor: pointer;
  border: 1px solid #e5e5ff;
  background: #f6f6ff;
  border-radius: 14px;
  padding: 12px 14px;
  text-align: left;
}

.userBtn:disabled {
  cursor: default;
  opacity: 0.7;
}

.userName {
  font-family: var(--font-display);
  font-weight: 700;
}

.userMeta {
  margin-top: 6px;
  font-family: var(--font-display);
  font-size: 13px;
  opacity: 0.8;
}

.telegramBtn {
  margin-top: 4px;
}

.widgetHint {
  margin-top: 10px;
  font-family: var(--font-display);
  font-size: 14px;
  opacity: 0.85;
}

@media (max-width: 768px) {
  .page {
    gap: 12px;
  }
  .content {
    padding: 16px 20px 20px 20px;
  }
  .title {
    font-size: 32px;
  }
  .usersGrid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-color-scheme: dark) {
  .widgetBox,
  .usersBox {
    background: #2d2d2d;
    border: 1px solid #3b3b3b;
  }

  .btn.secondary {
    background-color: #2d2d2d;
    color: #b8a8ff;
    border-color: #b8a8ff;
  }

  .userBtn {
    border-color: #4a4a4a;
    background: #242424;
    color: #e8e8e8;
  }

  .errorBox {
    background: #4a1f1f;
    border-color: #8e3c3c;
    color: #ffd6d6;
  }
}
</style>


