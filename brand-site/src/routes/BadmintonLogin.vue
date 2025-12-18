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
    // If userId is provided in query params, auto-login
    if (this.userId) {
      console.log("Auto-login with userId:", this.userId);
      await this.loginAs(this.userId);
    } else {
      // Otherwise redirect to ratings - login is not needed anymore
      this.$router.replace("/?page=badminton&section=ratings");
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


