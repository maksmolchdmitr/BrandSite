<template>
  <div class="page">
    <HeadBar :headItems="localizedHeadItems"></HeadBar>

    <div class="content">
      <div class="topRow">
        <h1 class="title">{{ $t('badminton.profile.title') }}</h1>
      </div>

      <div class="ctaRow">
        <RouterLink class="cta secondary" to="/?page=badminton&section=ratings">
          <span class="ctaText">{{ $t('badminton.ratings.title') }}</span>
        </RouterLink>
        <RouterLink class="cta secondary" to="/?page=badminton&section=groups">
          <span class="ctaText">{{ $t('badminton.ratings.myGroups') }}</span>
        </RouterLink>
      </div>

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
        <p v-else class="hint">{{ $t('common.actions.loading') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import HeadBar from "@/components/HeadBar.vue";
import ProfileEditForm from "@/components/badminton/ProfileEditForm.vue";
import { getDefaultBadmintonHeadItems } from "@/badminton/headItems.js";
import { badmintonClient } from "@/badminton/client.js";

export default defineComponent({
  name: "BadmintonProfile",
  components: { HeadBar, ProfileEditForm },
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
  },
});
</script>

<style scoped>
.page { min-height: 100vh; }
.content { max-width: 720px; margin: 0 auto; padding: 24px 16px 48px; }
.topRow { margin-bottom: 12px; }
.title { font-family: var(--font-display); font-size: 2rem; margin: 0; }
.ctaRow { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.cta {
  display: inline-flex;
  padding: 10px 16px;
  border-radius: 100px;
  text-decoration: none;
  border: 2px solid #e0e0ff;
  color: #4f3dff;
  background: white;
  font-weight: 700;
}
.errorBox {
  padding: 12px;
  border-radius: 10px;
  background: #ffe8e8;
  color: #a10;
  margin-bottom: 12px;
}
.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #ececff;
}
.cardTitle {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 12px;
}
.hint { opacity: 0.7; }
.btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  background: #4f3dff;
  color: white;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.btn.secondary {
  background: white;
  color: #4f3dff;
  border: 2px solid #e0e0ff;
}
</style>
