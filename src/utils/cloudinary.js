// src/utils/cloudinary.js
export async function uploadToCloudinary(fileOrBlob) {
  // ✅ Same env variable as Navbar.jsx (consistent)
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  // ✅ Preset fallback (same preset you used in Navbar)
  const preset =
    import.meta.env.VITE_CLOUDINARY_PRESET || "smart_home_preset_67";

  const folder = import.meta.env.VITE_CLOUDINARY_FOLDER || "profile_pics";

  if (!cloud) {
    throw new Error(
      "Cloudinary cloud name missing. Add VITE_CLOUDINARY_CLOUD_NAME in .env"
    );
  }
  if (!preset) {
    throw new Error(
      "Cloudinary upload preset missing. Add VITE_CLOUDINARY_PRESET in .env"
    );
  }

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

  const json = JSON.parse(text);
  return json.secure_url;
}
