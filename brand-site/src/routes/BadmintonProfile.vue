<template>
  <div class="page">
    <div class="content">
      <div class="topRow">
        <h1 class="title">{{ $t('badminton.profile.title') }}</h1>
        <BadmintonTopActions />
      </div>

      <BadmintonHubCtaRow current="profile" :disabled="saving || linking" @logout="logout" />

      <div v-if="error" class="errorBox">{{ error }}</div>

      <div v-if="linkConflict" class="warnBox">
        <div class="warnTitle">{{ $t('badminton.profile.linkConflictTitle') }}</div>
        <p class="warnText">
          {{ $t('badminton.profile.linkConflictBody', {
            username: linkConflict.conflictingUsername,
            singles: linkConflict.singlesMatchesCount,
            doubles: linkConflict.doublesMatchesCount,
            groups: linkConflict.groupsCount,
          }) }}
        </p>
        <p v-if="linkConflict.ownsGroups" class="warnText">
          {{ $t('badminton.profile.linkConflictOwnsGroups') }}
        </p>
        <div class="row">
          <button class="btn danger" :disabled="linking" @click="confirmLinkDelete">
            {{ $t('badminton.profile.linkConflictConfirm') }}
          </button>
          <button class="btn secondary" :disabled="linking" @click="cancelLinkConflict">
            {{ $t('common.actions.cancel') }}
          </button>
        </div>
      </div>

      <div class="card formPage">
        <div class="cardTitle">{{ $t('badminton.profile.accounts') }}</div>
        <div v-if="loaded" class="accounts">
          <div class="accountRow">
            <div>
              <div class="accountName">{{ $t('badminton.profile.yandex') }}</div>
              <div class="accountStatus">
                {{ me?.yandexLinked ? $t('badminton.profile.linked') : $t('badminton.profile.notLinked') }}
              </div>
            </div>
            <button
              v-if="!me?.yandexLinked"
              class="btn yandexBtn"
              :disabled="linking || !!linkConflict"
              @click="startLinkYandex"
            >
              {{ $t('badminton.profile.linkYandex') }}
            </button>
          </div>
          <div class="accountRow">
            <div>
              <div class="accountName">{{ $t('badminton.profile.telegram') }}</div>
              <div class="accountStatus">
                {{ me?.telegramLinked ? $t('badminton.profile.linked') : $t('badminton.profile.notLinked') }}
              </div>
            </div>
            <button
              v-if="!me?.telegramLinked"
              class="btn telegramBtn"
              :disabled="linking || !!linkConflict"
              @click="startLinkTelegram"
            >
              {{ $t('badminton.profile.linkTelegram') }}
            </button>
          </div>
          <p class="hint">{{ $t('badminton.profile.accountsHint') }}</p>
        </div>
        <p v-else class="hint"><LoadingPhrase :text="$t('common.actions.loading')" /></p>
      </div>

      <div class="card formPage">
        <div class="cardTitle">{{ $t('badminton.profile.edit') }}</div>
        <ProfileEditForm
          v-if="loaded"
          v-model:first-name="form.firstName"
          v-model:last-name="form.lastName"
          v-model:photo-url="form.photoUrl"
          v-model:photo-crop="form.photoCrop"
          :photo-cleared="form.photoCleared"
          :first-name-placeholder="$t('badminton.group.firstName')"
          :last-name-placeholder="$t('badminton.group.lastName')"
          :photo-url-placeholder="$t('badminton.group.photoUrlPlaceholder')"
          :photo-label="$t('badminton.group.photo')"
          :clear-photo-label="$t('badminton.group.clearPhoto')"
          :reset-crop-label="$t('badminton.group.resetCrop')"
          :square-crop-label="$t('badminton.group.cropSquare')"
          :crop-hint="$t('badminton.group.cropHint')"
          @clear-photo="clearPhoto"
          @photo-url-input="onPhotoUrlInput"
          @update:photo-crop="onPhotoCrop"
        >
          <template #actions>
            <button class="btn" :disabled="saving || linking" @click="save">{{ $t('common.actions.save') }}</button>
            <RouterLink class="btn secondary" to="/?page=badminton&section=ratings">{{ $t('common.actions.cancel') }}</RouterLink>
          </template>
        </ProfileEditForm>
        <p v-else class="hint"><LoadingPhrase :text="$t('common.actions.loading')" /></p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import ProfileEditForm from "@/components/badminton/ProfileEditForm.vue";
import BadmintonHubCtaRow from "@/components/badminton/BadmintonHubCtaRow.vue";
import BadmintonTopActions from "@/components/badminton/BadmintonTopActions.vue";
import { badmintonClient } from "@/badminton/client.js";
import {
  redirectToLoginAutoTg,
  buildYandexOAuthUrl,
  buildTelegramOAuthUrl,
  getYandexOAuthRedirectUri,
  markPendingAccountLink,
  clearPendingAccountLink,
  markExpectTgAuth,
  clearExpectTgAuth,
  shouldExpectTgAuth,
} from "@/badminton/apiHelpers.js";

let telegramPopupRef = null;

export default defineComponent({
  name: "BadmintonProfile",
  components: { ProfileEditForm, BadmintonHubCtaRow, BadmintonTopActions },
  data() {
    return {
      loaded: false,
      saving: false,
      linking: false,
      error: "",
      me: null,
      linkConflict: null,
      form: {
        firstName: "",
        lastName: "",
        originalFirstName: "",
        originalLastName: "",
        photoUrl: "",
        photoCrop: null,
        photoTouched: false,
        photoCleared: false,
        cropTouched: false,
      },
    };
  },
  async mounted() {
    if (redirectToLoginAutoTg(this.$router)) return;
    this.setupTelegramCallback();
    await this.load();
    await this.parseYandexLinkCallback();
  },
  beforeUnmount() {
    if (this.telegramMessageHandler) {
      window.removeEventListener("message", this.telegramMessageHandler);
    }
    if (telegramPopupRef) try { telegramPopupRef.close(); } catch (_) {}
    telegramPopupRef = null;
  },
  methods: {
    applyMe(me) {
      this.me = me;
      const firstName = String(me?.firstName || "").trim();
      const lastName = String(me?.lastName || "").trim();
      this.form = {
        firstName,
        lastName,
        originalFirstName: firstName,
        originalLastName: lastName,
        photoUrl: me?.photoUrl || "",
        photoCrop: me?.photoCrop || null,
        photoTouched: false,
        photoCleared: false,
        cropTouched: false,
      };
      this.loaded = true;
    },
    async load() {
      this.error = "";
      this.loaded = false;
      try {
        const me = await badmintonClient.getMe();
        this.applyMe(me);
      } catch (e) {
        this.error = e?.message || this.$t("badminton.profile.errLoad");
        if (String(e?.message || "").toLowerCase().includes("unauthorized")
          || e?.status === 401) {
          await this.$router.push("/?page=badminton&section=login");
        }
      }
    },
    async parseYandexLinkCallback() {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const oauthError = params.get("error");
      if (!code && !oauthError) return;
      const cleanQuery = { ...(this.$route?.query || {}) };
      delete cleanQuery.code;
      delete cleanQuery.error;
      delete cleanQuery.error_description;
      delete cleanQuery.state;
      delete cleanQuery.cid;
      this.$router.replace({ query: cleanQuery }).catch(() => {});
      clearPendingAccountLink();
      if (oauthError) {
        this.error = this.$t("badminton.profile.errLinkYandex");
        return;
      }
      await this.tryLinkYandex(code);
    },
    startLinkYandex() {
      this.error = "";
      this.linkConflict = null;
      markPendingAccountLink("yandex");
      this.linking = true;
      window.location.assign(buildYandexOAuthUrl());
    },
    startLinkTelegram() {
      this.error = "";
      this.linkConflict = null;
      markExpectTgAuth();
      const authUrl = buildTelegramOAuthUrl();
      const w = window.open(authUrl, "tg_link_" + Date.now(), "width=500,height=600,scrollbars=yes,resizable=yes");
      telegramPopupRef = w;
      if (!w) {
        clearExpectTgAuth();
        this.error = this.$t("badminton.login.errTelegramPopup");
      }
    },
    setupTelegramCallback() {
      const allowedOrigins = ["https://oauth.telegram.org", "https://t.me", "https://telegram.org"];
      this.telegramMessageHandler = (event) => {
        const fromTg = allowedOrigins.some((o) => event.origin === o || event.origin.startsWith(o + "/"));
        if (!fromTg || !shouldExpectTgAuth()) return;
        let data = event.data;
        if (typeof data === "string") {
          try { data = JSON.parse(data); } catch (_) { return; }
        }
        if (!data || typeof data !== "object") return;
        const payload = (data.result && typeof data.result === "object") ? data.result : data;
        if (!payload || !("id" in payload) || !("hash" in payload)) return;
        clearExpectTgAuth();
        if (telegramPopupRef) try { telegramPopupRef.close(); } catch (_) {}
        telegramPopupRef = null;
        this.tryLinkTelegram(payload);
      };
      window.addEventListener("message", this.telegramMessageHandler, false);
    },
    async tryLinkYandex(code) {
      this.linking = true;
      this.error = "";
      try {
        const me = await badmintonClient.linkYandex({
          code,
          redirectUri: getYandexOAuthRedirectUri(),
        });
        this.linkConflict = null;
        this.applyMe(me);
      } catch (e) {
        if (e?.status === 409 && e?.data?.code === "ACCOUNT_LINK_CONFLICT") {
          this.linkConflict = { ...e.data, provider: "yandex" };
        } else {
          this.error = e?.message || this.$t("badminton.profile.errLinkYandex");
        }
      } finally {
        this.linking = false;
      }
    },
    async tryLinkTelegram(telegramUser) {
      this.linking = true;
      this.error = "";
      try {
        const me = await badmintonClient.linkTelegram({ telegramUser });
        this.linkConflict = null;
        this.applyMe(me);
      } catch (e) {
        if (e?.status === 409 && e?.data?.code === "ACCOUNT_LINK_CONFLICT") {
          this.linkConflict = { ...e.data, provider: "telegram" };
        } else {
          this.error = e?.message || this.$t("badminton.profile.errLinkTelegram");
        }
      } finally {
        this.linking = false;
      }
    },
    async confirmLinkDelete() {
      if (!this.linkConflict?.pendingLinkId) return;
      this.linking = true;
      this.error = "";
      try {
        const provider = this.linkConflict.provider;
        const pendingLinkId = this.linkConflict.pendingLinkId;
        const me = provider === "telegram"
          ? await badmintonClient.linkTelegram({ confirmDelete: true, pendingLinkId })
          : await badmintonClient.linkYandex({ confirmDelete: true, pendingLinkId });
        this.linkConflict = null;
        this.applyMe(me);
      } catch (e) {
        this.error = e?.message || this.$t("badminton.profile.errLinkConfirm");
      } finally {
        this.linking = false;
      }
    },
    cancelLinkConflict() {
      this.linkConflict = null;
    },
    onPhotoUrlInput() {
      this.form = {
        ...this.form,
        photoTouched: true,
        photoCleared: false,
        cropTouched: true,
        photoCrop: null,
      };
    },
    onPhotoCrop(crop) {
      this.form = { ...this.form, photoCrop: crop, cropTouched: true };
    },
    clearPhoto() {
      this.form = {
        ...this.form,
        photoUrl: "",
        photoCrop: null,
        photoTouched: true,
        photoCleared: true,
        cropTouched: true,
      };
    },
    async save() {
      this.saving = true;
      this.error = "";
      try {
        const firstName = String(this.form.firstName || "").trim();
        const lastName = String(this.form.lastName || "").trim();
        const patch = {};
        if (firstName !== this.form.originalFirstName) {
          if (!firstName) {
            this.error = this.$t("badminton.profile.errSave");
            return;
          }
          patch.firstName = firstName;
        }
        if (lastName !== this.form.originalLastName) {
          if (!lastName) {
            this.error = this.$t("badminton.profile.errSave");
            return;
          }
          patch.lastName = lastName;
        }
        if (this.form.photoTouched) {
          patch.photoUrl = this.form.photoCleared ? "" : (this.form.photoUrl || "");
        }
        if (this.form.cropTouched) {
          patch.photoCrop = this.form.photoCrop;
        }
        if (patch.firstName == null && patch.lastName == null
          && patch.photoUrl === undefined && patch.photoCrop === undefined) {
          await this.$router.push("/?page=badminton&section=ratings");
          return;
        }
        await badmintonClient.updateMe(patch);
        await this.$router.push("/?page=badminton&section=ratings");
      } catch (e) {
        this.error = e?.message || this.$t("badminton.profile.errSave");
      } finally {
        this.saving = false;
      }
    },
    async logout() {
      this.saving = true;
      this.error = "";
      try {
        await badmintonClient.logout();
        await this.$router.push("/?page=badminton&section=login");
      } catch (e) {
        this.error = e?.message || this.$t("badminton.login.errLogout");
        this.saving = false;
      }
    },
  },
});
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 64px; max-width: 100%; box-sizing: border-box; }
.content { padding: 24px 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; box-sizing: border-box; min-width: 0; }
.topRow { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.title { margin: 0; font-family: var(--font-display); font-size: 40px; font-weight: 700; }

.card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.formPage { max-width: 640px; }
.cardTitle { font-family: var(--font-display); font-weight: 700; font-size: 20px; color: #4F3DFF; }
.hint { font-family: var(--font-display); font-size: 13px; opacity: 0.7; margin: 0; }
.row { display: flex; flex-wrap: wrap; gap: 10px; }

.accounts { display: flex; flex-direction: column; gap: 14px; }
.accountRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.accountName { font-family: var(--font-display); font-weight: 700; font-size: 16px; }
.accountStatus { font-family: var(--font-display); font-size: 13px; opacity: 0.75; }

.btn {
  flex: 0 0 auto;
  border: none;
  cursor: pointer;
  background-color: #4F3DFF;
  color: white;
  border-radius: 100px;
  padding: 12px 16px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.btn.secondary {
  background: white;
  color: #4F3DFF;
  border: 2px solid #4F3DFF;
}
.btn.danger {
  background: #c62828;
}
.btn.yandexBtn { background: #fc3f1d; }
.btn.telegramBtn { background: #2AABEE; }
.btn:disabled { opacity: 0.7; cursor: default; }

.errorBox, .warnBox {
  border-radius: 12px;
  padding: 12px 14px;
  font-family: var(--font-display);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.errorBox {
  background: #ffe6e6;
  border: 1px solid #ffb3b3;
}
.warnBox {
  background: #fff6e5;
  border: 1px solid #ffd089;
  max-width: 640px;
}
.warnTitle { font-weight: 700; font-size: 16px; }
.warnText { margin: 0; font-size: 14px; line-height: 1.4; }

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 16px 20px 20px 20px; }
  .title { font-size: 28px; }
  .card { padding: 16px; }
}

@media (prefers-color-scheme: dark) {
  .title { color: #e8e8e8; }

  .card {
    background: #2d2d2d;
    border: 1px solid #3b3b3b;
  }

  .btn.secondary {
    background-color: #2d2d2d;
  }

  .errorBox {
    background: #4a1f1f;
    border-color: #8e3c3c;
    color: #ffd6d6;
  }
  .warnBox {
    background: #4a3a1f;
    border-color: #8e6c3c;
    color: #ffe8c2;
  }
}
</style>
