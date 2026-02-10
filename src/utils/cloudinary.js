export async function uploadToCloudinary(fileOrBlob) {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD;
  const preset = import.meta.env.VITE_CLOUDINARY_PRESET;
  const folder = import.meta.env.VITE_CLOUDINARY_FOLDER || "profile_pics";

  const url = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;
  const fd = new FormData();
  fd.append("file", fileOrBlob);
  fd.append("upload_preset", preset);
  fd.append("folder", folder);

  const r = await fetch(url, { method: "POST", body: fd });
  const text = await r.text();

  if (!r.ok) {
    try {
      const j = JSON.parse(text);
      throw new Error(j?.error?.message || text);
    } catch {
      throw new Error(text);
    }
  }
  return JSON.parse(text).secure_url;
}
