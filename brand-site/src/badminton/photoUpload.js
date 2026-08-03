/** Shared helpers for participant photo upload (presign → PUT → publicUrl). */

export const MAX_PARTICIPANT_PHOTO_BYTES = 5_242_880;
export const ALLOWED_PARTICIPANT_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {"Content-Type": file.type},
    body: file,
  });
  if (!response.ok) {
    throw new Error("photoUploadFailed");
  }
  return publicUrl;
}
