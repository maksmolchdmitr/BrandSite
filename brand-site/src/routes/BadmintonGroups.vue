<template>
  <div class="page">
    <HeadBar :headItems="headItems"></HeadBar>

    <div class="content">
      <div class="topRow">
        <h1 class="title">My groups</h1>
        <button class="linkBtn logoutBtn" @click="logout">Logout</button>
      </div>

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div class="card">
        <div class="cardTitle">Create group</div>
        <div class="row">
          <input class="input" v-model="newGroupName" placeholder="Group name" />
          <button class="btn" :disabled="loadingCreate || !newGroupName" @click="create">
            {{ loadingCreate ? "Creating..." : "Create" }}
          </button>
        </div>
      </div>

      <div class="card">
        <div class="cardTitle">Groups</div>
        <button class="btn secondary" :disabled="loading" @click="load">
          {{ loading ? "Loading..." : "Refresh" }}
        </button>

        <div v-if="groups.length === 0 && !loading" class="empty">No groups yet.</div>

        <div class="list">
          <RouterLink v-for="g in groups" :key="g.id" class="groupRow" :to="`/badminton-service/groups/${g.id}`">
            <div class="groupName">{{ g.name }}</div>
            <div class="groupMeta">
              <span v-if="g.myRole" class="pill" :class="g.myRole === 'admin' ? 'admin' : ''">{{ g.myRole }}</span>
              <span class="arrow">→</span>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from "vue";
import HeadBar from "@/components/HeadBar.vue";
import {badmintonClient} from "@/badminton/client.js";

export default defineComponent({
  components: {HeadBar},
  data() {
    return {
      headItems: [
        {text: "Main", ref: "/", isMainSwitch: false},
        {text: "Products", ref: "/products", isMainSwitch: false},
        {text: "Badminton", ref: "/badminton-service", isMainSwitch: true},
      ],
      loading: false,
      loadingCreate: false,
      error: "",
      groups: [],
      newGroupName: "",
    };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = "";
      try {
        const res = await badmintonClient.getMyGroups();
        this.groups = Array.isArray(res) ? res : res.items || [];
      } catch (e) {
        this.error = e?.message || "Failed to load groups";
      } finally {
        this.loading = false;
      }
    },
    async create() {
      this.loadingCreate = true;
      this.error = "";
      try {
        const g = await badmintonClient.createGroup({name: this.newGroupName});
        this.newGroupName = "";
        this.groups = [g, ...this.groups];
        this.$router.push(`/badminton-service/groups/${g.id}`);
      } catch (e) {
        this.error = e?.message || "Failed to create group";
      } finally {
        this.loadingCreate = false;
      }
    },
    async logout() {
      await badmintonClient.logout();
      this.$router.replace("/badminton-service");
    },
  },
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Mali&display=swap');

.page { display: flex; flex-direction: column; gap: 64px; }
.content { padding: 0 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; }
.topRow { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.title { margin: 0; font-family: 'Mali','sans-serif'; font-size: 40px; font-weight: 700; }

.card { background: white; border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.cardTitle { font-family: 'Mali','sans-serif'; font-weight: 700; font-size: 18px; }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }

.input { padding: 12px 14px; border-radius: 12px; border: 1px solid #ddd; font-family: 'Mali','sans-serif'; font-size: 16px; min-width: min(520px, calc(100vw - 140px)); }

.btn { border: none; cursor: pointer; background-color: #4F3DFF; color: white; border-radius: 100px; padding: 12px 16px; font-family: 'Mali','sans-serif'; font-size: 16px; font-weight: 700; }
.btn.secondary { background: white; color: #4F3DFF; border: 2px solid #4F3DFF; }
.btn:disabled { opacity: 0.7; cursor: default; }

.linkBtn { text-decoration: none; font-family: 'Mali','sans-serif'; font-weight: 700; color: #4F3DFF; }
.logoutBtn { background: none; border: none; cursor: pointer; padding: 0; font-family: 'Mali','sans-serif'; font-weight: 700; color: #4F3DFF; }

.errorBox { background: #ffe6e6; border: 1px solid #ffb3b3; padding: 12px 14px; border-radius: 12px; font-family: 'Mali','sans-serif'; }
.empty { font-family: 'Mali','sans-serif'; opacity: 0.7; margin-top: 8px; }

.list { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
.groupRow { text-decoration: none; color: inherit; background: #f6f6ff; border-radius: 14px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.groupName { font-family: 'Mali','sans-serif'; font-weight: 700; }
.groupMeta { display: flex; align-items: center; gap: 10px; }
.pill { background: white; border: 1px solid rgba(79,61,255,0.35); color: #4F3DFF; padding: 4px 10px; border-radius: 999px; font-family: 'Mali','sans-serif'; font-size: 14px; font-weight: 700; }
.pill.admin { background: #4F3DFF; color: white; border-color: #4F3DFF; }
.arrow { font-weight: 700; color: #4F3DFF; }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 0 20px 20px 20px; }
  .title { font-size: 28px; }
  .input { min-width: calc(100vw - 40px); }
}
</style>


