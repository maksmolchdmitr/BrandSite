<template>
  <div class="page">
    <HeadBar :headItems="localizedHeadItems"></HeadBar>

    <div class="content">
      <div class="topRow">
        <h1 class="title">{{ $t('badminton.profile.title') }}</h1>
      </div>

      <BadmintonHubCtaRow current="profile" :disabled="saving" @logout="logout" />

      <div v-if="error" class="errorBox">{{ error }}</div>

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
            <button class="btn" :disabled="saving" @click="save">{{ $t('common.actions.save') }}</button>
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
import HeadBar from "@/components/HeadBar.vue";
import ProfileEditForm from "@/components/badminton/ProfileEditForm.vue";
import BadmintonHubCtaRow from "@/components/badminton/BadmintonHubCtaRow.vue";
import { getDefaultBadmintonHeadItems } from "@/badminton/headItems.js";
import { badmintonClient } from "@/badminton/client.js";

export default defineComponent({
  name: "BadmintonProfile",
  components: { HeadBar, ProfileEditForm, BadmintonHubCtaRow },
  data() {
    return {
      loaded: false,
      saving: false,
      error: "",
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
  computed: {
    localizedHeadItems() {
      return getDefaultBadmintonHeadItems(this.$t);
    },
  },
  async mounted() {
    await this.load();
  },
  methods: {
    async load() {
      this.error = "";
      this.loaded = false;
      try {
        const me = await badmintonClient.getMe();
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
      } catch (e) {
        this.error = e?.message || this.$t("badminton.profile.errLoad");
        if (String(e?.message || "").toLowerCase().includes("unauthorized")
          || e?.status === 401) {
          await this.$router.push("/?page=badminton&section=login");
        }
      }
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
        if (this.form.cropTouched && this.form.photoCrop) {
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
.content { padding: 0 50px 50px 50px; display: flex; flex-direction: column; gap: 16px; max-width: 100%; box-sizing: border-box; min-width: 0; }
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
.hint { font-family: var(--font-display); font-size: 13px; opacity: 0.7; }

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
.btn:disabled { opacity: 0.7; cursor: default; }

.errorBox {
  background: #ffe6e6;
  border: 1px solid #ffb3b3;
  padding: 12px 14px;
  border-radius: 12px;
  font-family: var(--font-display);
}

@media (max-width: 768px) {
  .page { gap: 12px; }
  .content { padding: 0 20px 20px 20px; }
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
}
</style>
