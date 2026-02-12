// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { resizeImageToBlob } from "../utils/image";
import { uploadToCloudinary } from "../utils/cloudinary";

export default function Profile() {
  const { user } = useAuthContext();

  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;

    (async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setName(data?.name || user.displayName || "");
        setPhotoURL(data?.photoURL || user.photoURL || "");
      }
    })();
  }, [user]);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    try {
      await updateProfile(auth.currentUser, {
        displayName: name,
        photoURL,
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          name,
          photoURL,
          email: user.email,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      setMsg("Profile updated successfully ✅");
    } catch (err) {
      setMsg(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleImage = async (file) => {
    if (!file) return;
    const blob = await resizeImageToBlob(file, 384, 0.8);
    const url = await uploadToCloudinary(blob);
    setPhotoURL(url);
  };

  if (!user) return null;

  return (
    <div className="container py-4 page-fade">
      <h3 className="mb-3">My Profile</h3>

      <div className="card card-neo p-4" style={{ maxWidth: 500 }}>
        <form onSubmit={onSave} className="d-grid gap-3">
          <div className="text-center">
            {photoURL ? (
              <img
                src={photoURL}
                alt="avatar"
                className="rounded-circle mb-3"
                width="120"
                height="120"
              />
            ) : (
              <div
                className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: 120, height: 120, fontSize: 40 }}
              >
                {name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          <div>
            <label className="form-label small text-muted mb-1">Name</label>
            <input
              className="form-control input-underline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label small text-muted mb-1">
              Change Photo
            </label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={(e) => handleImage(e.target.files?.[0])}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary rounded-pill"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {msg && <div className="alert alert-info mb-0">{msg}</div>}
        </form>
      </div>
    </div>
  );
}
