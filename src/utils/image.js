// src/utils/image.js
export async function resizeImageToBlob(file, maxSide = 384, quality = 0.82) {
  // Read file -> dataURL
  const dataURL = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

  // Create image
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataURL;
  });

  // Fit within square maxSide while keeping aspect
  const scale = Math.min(maxSide / img.width, maxSide / img.height, 1);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  // Draw -> JPEG blob
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  return blob; // pass this to uploadToCloudinary(blob)
}
