const AVATAR_SIZE = 128;
const JPEG_QUALITY = 0.75;

/**
 * Resize an image File to a small square JPEG data-URL for participant avatars.
 * No server upload infra — stored as photoUrl string.
 */
export function fileToAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !String(file.type || "").startsWith("image/")) {
      reject(new Error("Expected an image file"));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const context = canvas.getContext("2d");
        const scale = Math.max(AVATAR_SIZE / image.width, AVATAR_SIZE / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        const offsetX = (AVATAR_SIZE - drawWidth) / 2;
        const offsetY = (AVATAR_SIZE - drawHeight) / 2;
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
        context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    image.src = objectUrl;
  });
}
