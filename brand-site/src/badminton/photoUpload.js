/** Shared helpers for participant photo upload (presign → PUT → publicUrl). */

export const MAX_PARTICIPANT_PHOTO_BYTES = 5_242_880;
export const ALLOWED_PARTICIPANT_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const UPLOAD_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function assertParticipantPhotoFile(file) {
  if (!file) {
    throw new Error("photoFileRequired");
  }
  if (!ALLOWED_PARTICIPANT_PHOTO_TYPES.has(file.type)) {
    throw new Error("photoTypeUnsupported");
  }
  if (file.size > MAX_PARTICIPANT_PHOTO_BYTES) {
    throw new Error("photoTooLarge");
  }
}

/** @returns {File | null} */
export function participantPhotoFileFromPaste(event) {
  const items = event?.clipboardData?.items;
  if (!items) return null;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file) return file;
  }
  return null;
}

/**
 * @param {File} file
 * @param {(body: {contentType: string, contentLength: number}) => Promise<{uploadUrl: string, publicUrl: string}>} createPhotoUploadUrl
 */
export async function uploadParticipantPhotoViaPresign(file, createPhotoUploadUrl) {
  assertParticipantPhotoFile(file);
  const {uploadUrl, publicUrl} = await createPhotoUploadUrl({
    contentType: file.type,
    contentLength: file.size,
  });

  let lastError = new Error("photoUploadFailed");
  for (let attempt = 0; attempt <= UPLOAD_RETRY_DELAYS_MS.length; attempt++) {
    let shouldRetry = false;
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {"Content-Type": file.type},
        body: file,
      });
      if (response.ok) {
        return publicUrl;
      }
      lastError = new Error("photoUploadFailed");
      shouldRetry =
        response.status >= 500 || response.status === 408 || response.status === 429;
    } catch (_) {
      lastError = new Error("photoUploadFailed");
      shouldRetry = true;
    }
    if (!shouldRetry || attempt >= UPLOAD_RETRY_DELAYS_MS.length) {
      throw lastError;
    }
    await sleep(UPLOAD_RETRY_DELAYS_MS[attempt]);
  }
  throw lastError;
}
