<template>
  <div class="page">
    <HeadBar :headItems="headItems"></HeadBar>

    <div class="content">
      <h1 class="title">Login</h1>
      <p class="subtitle">
        Пока бэк не готов — моковый логин: выбери пользователя, чтобы “войти” (cookie) и потрогать весь интерфейс.
      </p>

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div class="row">
        <button class="btn secondary" :disabled="loading" @click="logout">
          {{ loading ? "..." : "Logout (clear cookie)" }}
        </button>
      </div>

      <div class="widgetBox">
        <div class="widgetTitle">Вход через Telegram</div>
        <button type="button" class="btn telegramBtn" :disabled="loading" @click="goToTelegramOAuth">
          Войти через Telegram
        </button>
        <div class="widgetHint">
          Откроется окно авторизации Telegram. Разрешите всплывающие окна для этого сайта, если окно не открылось.
        </div>
      </div>

      <div class="usersBox">
        <div class="widgetTitle">Mock users</div>
        <div class="usersGrid">
          <button v-for="u in users" :key="u.id" class="userBtn" :disabled="loading" @click="loginAs(u.id)">
            <div class="userName">{{ u.displayName || u.username || u.id }}</div>
            <div class="userMeta">id: {{ u.id }} · tg: {{ u.telegramId }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import HeadBar from "@/components/HeadBar.vue";
import {badmintonClient} from "@/badminton/client.js";
import {getLoggedInUserId} from "@/badminton/cookies.js";
import {TELEGRAM_OAUTH_BOT_ID, BADMINTON_DEBUG} from "@/badminton/apiHelpers.js";

let telegramPopupRef = null;

function tgLog(...args) {
  if (BADMINTON_DEBUG) console.log("[TG Auth]", ...args);
}

export default defineComponent({
  components: {HeadBar},
  props: {
    userId: {
      type: String,
      default: null
    }
  },
  async mounted() {
    this.parseTelegramCallbackFromUrl();
    this.setupTelegramCallback();
    try {
      if (badmintonClient.listMockUsers) {
        this.users = await badmintonClient.listMockUsers();
      }
    } catch (e) {
      console.warn("Failed to load mock users:", e);
    }
    if (this.userId) {
      await this.loginAs(this.userId);
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
      headItems: [
        {text: "Main", ref: "/?page=main", isMainSwitch: false},
        {text: "Products", ref: "/?page=products", isMainSwitch: false},
        {text: "Badminton", ref: "/?page=badminton&section=ratings", isMainSwitch: true},
      ],
      loading: false,
      error: "",
      users: [],
      telegramAuthProcessed: false,
    };
  },
  methods: {
    goToTelegramOAuth() {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_OAUTH_BOT_ID}&origin=${encodeURIComponent(origin)}&request_access=write`;
      tgLog("1. Opening OAuth popup", { origin, url });
      if (!origin) {
        this.error = "Не удалось определить origin страницы";
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
    parseTelegramCallbackFromUrl() {
      if (this.telegramAuthProcessed) return;
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
      const query = new URLSearchParams(this.$route?.query || "");
      const hasQuery = telegramParams.some((p) => query.has(p));
      if (hasQuery && Object.keys(fromQuery(query)).length >= 3) {
        tgLog("Callback from URL query", fromQuery(query));
        this.telegramAuthProcessed = true;
        this.handleTelegramAuth(fromQuery(query));
        return;
      }
      if (typeof window === "undefined" || !window.location.hash) return;
      const hash = window.location.hash.replace(/^#/, "");
      const hashParams = new URLSearchParams(hash);
      const hasHash = telegramParams.some((p) => hashParams.has(p));
      if (hasHash && !this.telegramAuthProcessed && Object.keys(fromQuery(hashParams)).length >= 3) {
        tgLog("Callback from URL hash", fromQuery(hashParams));
        this.telegramAuthProcessed = true;
        this.handleTelegramAuth(fromQuery(hashParams));
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
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
        await badmintonClient.telegramLogin(telegramData);
        tgLog("6. telegramLogin OK");
        await new Promise((r) => setTimeout(r, 150));
        await this.$router.push("/?page=badminton&section=ratings");
      } catch (e) {
        tgLog("7. telegramLogin failed", e?.message);
        this.error = e?.message || "Ошибка авторизации через Telegram";
      } finally {
        this.loading = false;
      }
    },
    async loginAs(userId) {
      this.loading = true;
      this.error = "";
      try {
        console.log("Logging in as:", userId);
        const user = await badmintonClient.loginAsUser(userId);
        console.log("Login successful, user:", user);
        
        // Verify cookie is set
        const cookieUserId = getLoggedInUserId();
        console.log("Cookie after login:", cookieUserId);
        
        if (!cookieUserId) {
          throw new Error("Cookie was not set after login");
        }
        
        // Small delay to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Navigate to ratings page - use push instead of replace to ensure navigation
        console.log("Navigating to /?page=badminton&section=ratings");
        try {
          await this.$router.push("/?page=badminton&section=ratings");
          console.log("Navigation complete");
        } catch (navError) {
          console.error("Navigation error:", navError);
          // Fallback: try replace
          await this.$router.replace("/?page=badminton&section=ratings");
        }
      } catch (e) {
        console.error("Login error:", e);
        this.error = e?.message || "Login failed";
        this.loading = false;
      }
    },
    async logout() {
      this.loading = true;
      this.error = "";
      try {
        await badmintonClient.logout();
      } catch (e) {
        this.error = e?.message || "Logout failed";
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Mali&display=swap');

.page {
  display: flex;
  flex-direction: column;
  gap: 64px;
}

.content {
  padding: 0 50px 50px 50px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.title {
  margin: 0;
  font-family: 'Mali', 'sans-serif';
  font-size: 48px;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  font-family: 'Mali', 'sans-serif';
  font-size: 20px;
  max-width: 960px;
}

.row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  border: none;
  cursor: pointer;
  background-color: #4F3DFF;
  color: white;
  border-radius: 100px;
  padding: 14px 18px;
  font-family: 'Mali', 'sans-serif';
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
  font-family: 'Mali', 'sans-serif';
}

.widgetBox {
  margin-top: 6px;
  background: white;
  border-radius: 18px;
  padding: 16px;
  max-width: 420px;
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
  font-family: 'Mali', 'sans-serif';
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
  font-family: 'Mali', 'sans-serif';
  font-weight: 700;
}

.userMeta {
  margin-top: 6px;
  font-family: 'Mali', 'sans-serif';
  font-size: 13px;
  opacity: 0.8;
}

.telegramBtn {
  margin-top: 4px;
}

.widgetHint {
  margin-top: 10px;
  font-family: 'Mali', 'sans-serif';
  font-size: 14px;
  opacity: 0.85;
}

@media (max-width: 768px) {
  .page {
    gap: 12px;
  }
  .content {
    padding: 0 20px 20px 20px;
  }
  .title {
    font-size: 32px;
  }
  .usersGrid {
    grid-template-columns: 1fr;
  }
}
</style>


