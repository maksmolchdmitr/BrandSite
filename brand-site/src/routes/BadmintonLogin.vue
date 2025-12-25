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
        <div id="telegram-login-widget"></div>
        <div class="widgetHint">
          Используйте виджет Telegram для авторизации
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

export default defineComponent({
  components: {HeadBar},
  props: {
    userId: {
      type: String,
      default: null
    }
  },
  async mounted() {
    // Check if Telegram callback data is in route.query (from RouterView)
    this.checkRouteQueryForTelegramData();
    
    // Setup message listener for Telegram callback first
    this.setupTelegramCallback();
    
    // Load mock users for fallback (only for mock client)
    try {
      if (badmintonClient.listMockUsers) {
        this.users = await badmintonClient.listMockUsers();
      }
    } catch (e) {
      console.warn('Failed to load mock users:', e);
    }
    
    // Wait for DOM to be ready, then load Telegram widget
    await this.$nextTick();
    setTimeout(() => {
      this.loadTelegramWidget();
    }, 100);
    
    // If userId is provided in query params, auto-login
    if (this.userId) {
      console.log("Auto-login with userId:", this.userId);
      await this.loginAs(this.userId);
    }
  },
  beforeUnmount() {
    // Clean up message listener
    if (this.telegramMessageHandler) {
      window.removeEventListener("message", this.telegramMessageHandler);
    }
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
      telegramAuthProcessed: false, // Flag to prevent double processing
    };
  },
  methods: {
    checkRouteQueryForTelegramData() {
      // Prevent double processing
      if (this.telegramAuthProcessed) {
        return;
      }
      
      // Check if route.query contains Telegram callback data
      const route = this.$route;
      if (!route || !route.query) {
        return;
      }
      
      const query = route.query;
      const telegramParams = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date', 'hash'];
      const hasTelegramData = telegramParams.some(param => query.hasOwnProperty(param));
      
      if (hasTelegramData) {
        console.log('🔍 Found Telegram data in route.query:', query);
        this.telegramAuthProcessed = true; // Mark as processed
        
        const telegramData = {};
        telegramParams.forEach(param => {
          if (query.hasOwnProperty(param)) {
            const value = query[param];
            // Parse numeric values
            if (param === 'id' || param === 'auth_date') {
              telegramData[param] = typeof value === 'string' ? parseInt(value, 10) : value;
            } else {
              telegramData[param] = value;
            }
          }
        });
        
        console.log('✅ Parsed Telegram data from route.query:', telegramData);
        // Process Telegram auth
        this.handleTelegramAuth(telegramData);
      }
    },
    async loadTelegramWidget() {
      // Check if script already loaded
      if (document.querySelector('script[src*="telegram-widget.js"]')) {
        return;
      }

      // Get state from backend
      let state = null;
      let botUsername = 'maksmolch_badminton_service_bot';
      
      try {
        const redirectUrl = `${window.location.origin}${window.location.pathname}`;
        console.log('🚀 Starting Telegram auth:', {
          redirectUrl: redirectUrl,
          currentUrl: window.location.href
        });
        
        // Get state from backend
        const startResponse = await badmintonClient.authTelegramStart({
          redirectUrl: redirectUrl
        });
        
        console.log('✅ Telegram auth start response:', JSON.stringify(startResponse, null, 2));
        state = startResponse.state;
        botUsername = startResponse.botUsername || botUsername;
        console.log('🔐 Auth state received:', state);
        console.log('🤖 Bot username:', botUsername);
      } catch (e) {
        console.error('Failed to get auth state from backend:', e);
        this.error = 'Не удалось инициализировать авторизацию Telegram';
        return;
      }

      // Create script element for Telegram widget
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://telegram.org/js/telegram-widget.js?7';
      script.setAttribute('data-telegram-login', botUsername);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-userpic', 'false');
      script.setAttribute('data-request-access', 'write');
      
      // Use callback URL - current page
      const callbackUrl = `${window.location.origin}${window.location.pathname}`;
      script.setAttribute('data-auth-url', callbackUrl);
      
      // Add state if available (Telegram widget supports state parameter)
      if (state) {
        // Note: Telegram widget doesn't directly support state in data-state,
        // but we store it in sessionStorage and verify it in handleTelegramAuth
      }
      
      // Find container and append script
      const container = document.getElementById('telegram-login-widget');
      if (!container) {
        console.error('Telegram widget container not found');
        this.error = 'Ошибка: контейнер виджета не найден';
        return;
      }
      
      // Clear container first
      container.innerHTML = '';
      
      // Append script to container - Telegram widget will render here
      container.appendChild(script);
      
      console.log('Telegram widget script added to container', {
        botUsername,
        callbackUrl,
        container: container.id,
        scriptAttrs: {
          'data-telegram-login': script.getAttribute('data-telegram-login'),
          'data-size': script.getAttribute('data-size'),
          'data-auth-url': script.getAttribute('data-auth-url')
        }
      });
      
      // Wait for script to load and widget to render
      script.onload = () => {
        console.log('Telegram widget script loaded');
        setTimeout(() => {
          const iframe = container.querySelector('iframe');
          if (iframe) {
            console.log('Telegram widget iframe rendered successfully');
          } else {
            console.warn('Telegram widget iframe not found - widget may not be rendering. Check bot username and domain settings in Telegram BotFather.');
          }
        }, 500);
      };
      
      script.onerror = () => {
        console.error('Failed to load Telegram widget script');
        this.error = 'Не удалось загрузить виджет Telegram';
      };
    },
    setupTelegramCallback() {
      // Handle Telegram callback via postMessage (fallback)
      this.telegramMessageHandler = (event) => {
        console.log('📨 Telegram postMessage event received:', {
          origin: event.origin,
          data: event.data,
          type: typeof event.data,
          isTelegram: event.origin.includes('https://t.me') || event.origin.includes('https://telegram.org')
        });
        
        // Check origin
        if (event.origin.includes('https://t.me') || event.origin.includes('https://telegram.org')) {
          console.log('✅ Telegram postMessage data:', JSON.stringify(event.data, null, 2));
          
          // Telegram sends data in format: {id, first_name, last_name, username, photo_url, auth_date, hash}
          if (event.data && typeof event.data === 'object' && !this.telegramAuthProcessed) {
            this.telegramAuthProcessed = true; // Mark as processed
            this.handleTelegramAuth(event.data);
          } else if (this.telegramAuthProcessed) {
            console.log('ℹ️ Telegram data already processed, ignoring postMessage');
          } else {
            console.warn('⚠️ Telegram postMessage data is not an object:', event.data);
          }
        }
      };
      
      window.addEventListener('message', this.telegramMessageHandler, false);
      
      // Check URL params for callback (Telegram widget redirects to auth-url with data in query params)
      const urlParams = new URLSearchParams(window.location.search);
      const allParams = {};
      for (const [key, value] of urlParams.entries()) {
        allParams[key] = value;
      }
      
      console.log('🔍 Checking URL params for Telegram callback:', {
        fullUrl: window.location.href,
        search: window.location.search,
        allParams: allParams
      });
      
      // Telegram sends data as: id, first_name, last_name, username, photo_url, auth_date, hash
      const telegramParams = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date', 'hash'];
      const hasTelegramData = telegramParams.some(param => urlParams.has(param));
      
      console.log('📋 Telegram params check:', {
        hasTelegramData,
        foundParams: telegramParams.filter(param => urlParams.has(param)),
        missingParams: telegramParams.filter(param => !urlParams.has(param))
      });
      
      if (hasTelegramData && !this.telegramAuthProcessed) {
        this.telegramAuthProcessed = true; // Mark as processed
        const telegramData = {};
        telegramParams.forEach(param => {
          if (urlParams.has(param)) {
            const value = urlParams.get(param);
            // Parse numeric values
            if (param === 'id' || param === 'auth_date') {
              telegramData[param] = parseInt(value, 10);
            } else {
              telegramData[param] = value;
            }
          }
        });
        
        console.log('✅ Telegram callback data received (URL redirect):', JSON.stringify(telegramData, null, 2));
        console.log('📤 Processing Telegram auth with data:', telegramData);
        this.handleTelegramAuth(telegramData);
        
        // Clean URL after processing
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log('🧹 URL cleaned, redirecting to:', cleanUrl);
      } else if (!hasTelegramData) {
        console.log('ℹ️ No Telegram callback data found in URL params');
      } else {
        console.log('ℹ️ Telegram data already processed, skipping');
      }
    },
    async handleTelegramAuth(telegramData) {
      this.loading = true;
      this.error = '';
      
      try {
        console.log('🔄 ===== TELEGRAM AUTH HANDLER =====');
        console.log('📥 Received Telegram data:', JSON.stringify(telegramData, null, 2));
        console.log('📊 Telegram data details:', {
          userId: telegramData.id,
          firstName: telegramData.first_name,
          lastName: telegramData.last_name,
          username: telegramData.username,
          photoUrl: telegramData.photo_url,
          authDate: telegramData.auth_date,
          hash: telegramData.hash ? telegramData.hash.substring(0, 20) + '...' : 'missing'
        });
        
        // Get state from sessionStorage (stored during authTelegramStart)
        const state = sessionStorage.getItem('telegram_auth_state') || 'mock-state';
        console.log('🔐 Auth state from sessionStorage:', state);
        
        const requestPayload = {
          state: state,
          telegram: telegramData
        };
        
        console.log('📤 Sending request to backend:', {
          endpoint: '/api/auth/telegram/complete',
          payload: {
            state: requestPayload.state,
            telegram: {
              id: requestPayload.telegram.id,
              first_name: requestPayload.telegram.first_name,
              last_name: requestPayload.telegram.last_name,
              username: requestPayload.telegram.username,
              auth_date: requestPayload.telegram.auth_date,
              hash: requestPayload.telegram.hash ? requestPayload.telegram.hash.substring(0, 20) + '...' : 'missing'
            }
          }
        });
        
        // Send telegram data to backend
        const result = await badmintonClient.authTelegramComplete(requestPayload);
        
        console.log('✅ ===== AUTH SUCCESS =====');
        console.log('📥 Backend response:', JSON.stringify(result, null, 2));
        console.log('🔑 Access token received:', result.accessToken ? result.accessToken.substring(0, 20) + '...' : 'missing');
        console.log('⏱️ Token expires in:', result.expiresInSec, 'seconds');
        
        // Clear state
        sessionStorage.removeItem('telegram_auth_state');
        console.log('🧹 Cleared auth state from sessionStorage');
        
        // Navigate to ratings page
        console.log('🧭 Navigating to ratings page...');
        await new Promise(resolve => setTimeout(resolve, 150));
        await this.$router.push('/?page=badminton&section=ratings');
        console.log('✅ Navigation complete');
        
      } catch (e) {
        console.error('❌ ===== AUTH ERROR =====');
        console.error('🚨 Error details:', {
          message: e?.message,
          stack: e?.stack,
          status: e?.status,
          data: e?.data
        });
        this.error = e?.message || 'Ошибка авторизации через Telegram';
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


