<template>
  <div class="formStack">
    <div class="row">
      <input
        class="input"
        :value="firstName"
        :placeholder="firstNamePlaceholder"
        @input="$emit('update:firstName', $event.target.value)"
      />
      <input
        class="input"
        :value="lastName"
        :placeholder="lastNamePlaceholder"
        @input="$emit('update:lastName', $event.target.value)"
      />
    </div>
    <div class="photoPickerRow">
      <div class="photoPreview" :class="{ empty: !previewable }">
        <PhotoHoldPreview
          v-if="previewable"
          :src="photoUrl"
          :photo-crop="photoCrop"
          alt=""
        />
        <span v-else>{{ photoLabel }}</span>
      </div>
      <slot name="photo-actions" />
      <input
        class="input"
        :value="photoUrl"
        :placeholder="photoUrlPlaceholder"
        @input="onPhotoUrlInput"
      />
      <button
        v-if="photoUrl || photoCleared"
        type="button"
        class="btn secondary small"
        @click="$emit('clear-photo')"
      >
        {{ clearPhotoLabel }}
      </button>
    </div>
    <PhotoCropEditor
      v-if="previewable"
      :src="photoUrl"
      :model-value="photoCrop"
      :reset-label="resetCropLabel"
      :square-label="squareCropLabel"
      :hint="cropHint"
      @update:model-value="$emit('update:photoCrop', $event)"
    />
    <div class="row formActions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import PhotoHoldPreview from "@/components/badminton/PhotoHoldPreview.vue";
import PhotoCropEditor from "@/components/badminton/PhotoCropEditor.vue";

export default defineComponent({
  name: "ProfileEditForm",
  components: { PhotoHoldPreview, PhotoCropEditor },
  props: {
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    photoCrop: { type: Object, default: null },
    photoCleared: { type: Boolean, default: false },
    firstNamePlaceholder: { type: String, default: "" },
    lastNamePlaceholder: { type: String, default: "" },
    photoUrlPlaceholder: { type: String, default: "" },
    photoLabel: { type: String, default: "Photo" },
    clearPhotoLabel: { type: String, default: "Clear" },
    resetCropLabel: { type: String, default: "Reset crop" },
    squareCropLabel: { type: String, default: "1:1" },
    cropHint: { type: String, default: "" },
  },
  emits: [
    "update:firstName",
    "update:lastName",
    "update:photoUrl",
    "update:photoCrop",
    "clear-photo",
    "photo-url-input",
  ],
  computed: {
    previewable() {
      const url = String(this.photoUrl || "").trim();
      return url.startsWith("http://") || url.startsWith("https://");
    },
  },
  methods: {
    onPhotoUrlInput(event) {
      this.$emit("update:photoUrl", event.target.value);
      this.$emit("photo-url-input");
    },
  },
});
</script>

<style scoped>
.formStack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
}
.row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.input {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #ddd;
  font-family: var(--font-display);
  font-size: 16px;
  flex: 1 1 0;
  min-width: 140px;
  max-width: 100%;
  box-sizing: border-box;
}
.photoPickerRow {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-width: 0;
}
.photoPickerRow .input {
  flex: 1 1 180px;
  width: auto;
  min-width: 160px;
}
.photoPreview {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  background: #f6f6ff;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 12px;
  flex: 0 0 auto;
}
.photoPreview.empty {
  color: #888;
}
.photoPreview :deep(img),
.photoPreview :deep(.photoCropFrame) {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
}
.formActions {
  margin-top: 4px;
}
.btn {
  flex: 0 0 auto;
  border: none;
  cursor: pointer;
  background-color: #4F3DFF;
  color: white;
  border-radius: 100px;
  padding: 10px 14px;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
}
.btn.secondary {
  background: white;
  color: #4F3DFF;
  border: 2px solid #4F3DFF;
}
.btn.secondary.small {
  padding: 6px 12px;
  font-size: 13px;
}

@media (prefers-color-scheme: dark) {
  .input {
    background: #242424;
    border-color: #4a4a4a;
    color: #e8e8e8;
  }
  .photoPreview {
    background: #242424;
    border-color: #4a4a4a;
  }
  .btn.secondary {
    background-color: #2d2d2d;
  }
}
</style>
