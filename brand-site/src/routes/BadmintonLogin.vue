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
    // Setup message listener for Telegram callback first
    this.setupTelegramCallback();
    
    // Load mock users for fallback
    try {
      this.users = await badmintonClient.listMockUsers();
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
        {text: "Badminton", ref: "/?page=badminton", isMainSwitch: true},
      ],
      loading: false,
      error: "",
      users: [],
    };
  },
  methods: {
    async loadTelegramWidget() {
      // Check if script already loaded
      if (document.querySelector('script[src*="telegram-widget.js"]')) {
        return;
      }

      // Get state from backend
      let state = null;
      let botUsername = 'maksmolch_badminton_service_bot';
      
      try {
        // Get state from backend
        const startResponse = await badmintonClient.authTelegramStart({
          redirectUrl: `${window.location.origin}${window.location.pathname}`
        });
        state = startResponse.state;
        botUsername = startResponse.botUsername || botUsername;
        console.log('Telegram auth started, state:', state);
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
        // Check origin
        if (event.origin.includes('https://t.me') || event.origin.includes('https://telegram.org')) {
          console.log('Данные от Telegram (postMessage):', event.data);
          
          // Telegram sends data in format: {id, first_name, last_name, username, photo_url, auth_date, hash}
          if (event.data && typeof event.data === 'object') {
            this.handleTelegramAuth(event.data);
          }
        }
      };
      
      window.addEventListener('message', this.telegramMessageHandler, false);
      
      // Check URL params for callback (Telegram widget redirects to auth-url with data in query params)
      const urlParams = new URLSearchParams(window.location.search);
      
      // Telegram sends data as: id, first_name, last_name, username, photo_url, auth_date, hash
      const telegramParams = ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date', 'hash'];
      const hasTelegramData = telegramParams.some(param => urlParams.has(param));
      
      if (hasTelegramData) {
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
        
        console.log('Данные от Telegram (URL redirect):', telegramData);
        this.handleTelegramAuth(telegramData);
        
        // Clean URL after processing
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    },
    async handleTelegramAuth(telegramData) {
      this.loading = true;
      this.error = '';
      
      try {
        console.log('Обработка авторизации Telegram:', telegramData);
        
        // Get state from sessionStorage (stored during authTelegramStart)
        const state = sessionStorage.getItem('telegram_auth_state') || 'mock-state';
        
        // Send telegram data to backend
        const result = await badmintonClient.authTelegramComplete({
          state: state,
          telegram: telegramData
        });
        
        console.log('Авторизация успешна:', result);
        
        // Clear state
        sessionStorage.removeItem('telegram_auth_state');
        
        // Navigate to ratings page
        await new Promise(resolve => setTimeout(resolve, 150));
        await this.$router.push('/?page=badminton&section=ratings');
        
      } catch (e) {
        console.error('Ошибка авторизации Telegram:', e);
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


