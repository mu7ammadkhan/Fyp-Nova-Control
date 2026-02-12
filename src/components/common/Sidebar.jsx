// src/components/common/Sidebar.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut, updateProfile } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { useAuthContext } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { resizeImageToBlob } from "../../utils/image";
import { uploadToCloudinary } from "../../utils/cloudinary";

export default function Sidebar() {
  const { user } = useAuthContext();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  const email = user?.email || "";
  const fallbackName =
    user?.displayName || (email ? email.split("@")[0] : "User");

  // ✅ Single source of truth: Firestore user doc
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (!alive) return;

      if (snap.exists()) {
        const d = snap.data();
        setName(d?.name || fallbackName);
        setPhotoURL(d?.photoURL || ""); // ✅ DO NOT mix auth.photoURL here
      } else {
        // create user doc if missing
        await setDoc(
          ref,
          { email, name: fallbackName, photoURL: "", createdAt: Date.now() },
          { merge: true }
        );
        if (!alive) return;
        setName(fallbackName);
        setPhotoURL("");
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ✅ Hard-close offcanvas (Bootstrap + fallback)
  const hardCloseOffcanvas = () => {
    const offEl = document.getElementById("mobileSidebar");
    if (!offEl) return;

    try {
      const inst = window?.bootstrap?.Offcanvas?.getOrCreateInstance(offEl);
      inst?.hide();
    } catch (_) {}

    offEl.classList.remove("show");
    offEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("offcanvas-backdrop", "modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");

    document.querySelectorAll(".offcanvas-backdrop").forEach((b) => b.remove());
  };

  const go = (to) => {
    navigate(to);
    setTimeout(hardCloseOffcanvas, 80);
  };

  const isActive = (to) => {
    if (to === "/dashboard") return location.pathname.startsWith("/dashboard");
    if (to === "/room") return location.pathname.startsWith("/room");
    if (to === "/devices") return location.pathname === "/devices";
    if (to === "/profile") return location.pathname === "/profile";
    return location.pathname === to;
  };

  const item = (to, icon, label) => (
    <li className="nav-item">
      <button
        type="button"
        className={`nav-link nc-link d-flex align-items-center gap-2 ${
          isActive(to) ? "active" : ""
        }`}
        onClick={() => go(to)}
      >
        <i className={`fa-solid ${icon} me-2`} />
        <span>{label}</span>
      </button>
    </li>
  );

  const onSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    const newName = e.target.elements["nc-name"].value.trim();
    const file = e.target.elements["nc-photo"].files[0];

    try {
      let newURL = photoURL;

      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          return alert("Please choose an image ≤ 5MB");
        }
        const blob = await resizeImageToBlob(file, 384, 0.82);
        newURL = await uploadToCloudinary(blob); // ✅ now uses correct env var
      }

      // ✅ (Optional but good) Update Firebase Auth display too
      await updateProfile(auth.currentUser, {
        displayName: newName || fallbackName,
        photoURL: newURL || null,
      });

      // ✅ Update Firestore (main source of truth)
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: newName || fallbackName,
          photoURL: newURL || "",
          email,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      // ✅ Update local UI
      setName(newName || fallbackName);
      setPhotoURL(newURL || "");

      // Close modal then sidebar
      const modalEl = document.getElementById("profileEditModal");
      const modal = window?.bootstrap?.Modal?.getOrCreateInstance(modalEl);
      modal?.hide();
      document.activeElement?.blur();

      modalEl?.addEventListener("hidden.bs.modal", hardCloseOffcanvas, {
        once: true,
      });
    } catch (err) {
      alert(err?.message || "Failed to update profile");
    }
  };

  if (!user) return null;

  return (
    <>
      <div
        className="offcanvas offcanvas-end nc-offcanvas"
        tabIndex="-1"
        id="mobileSidebar"
        aria-labelledby="mobileSidebarLabel"
      >
        <div className="offcanvas-header pb-2">
          <div className="d-flex align-items-center gap-2">
            <span className="brand-icon d-inline-grid place-items-center">
              <i className="fa-solid fa-house" />
            </span>
            <h6 className="offcanvas-title m-0 fw-bold" id="mobileSidebarLabel">
              Nova Control
            </h6>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={hardCloseOffcanvas}
            aria-label="Close"
          />
        </div>

        <div className="px-3">
          <button
            type="button"
            className="nc-profile card-neo p-3 w-100 text-start"
            data-bs-toggle="modal"
            data-bs-target="#profileEditModal"
          >
            <div className="d-flex align-items-center gap-3">
              <div className="nc-avatar">
                {photoURL ? (
                  <img src={photoURL} alt="avatar" />
                ) : (
                  <span>{(name || "U")[0].toUpperCase()}</span>
                )}
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold">{name || fallbackName}</div>
                <div className="small text-muted">{email || "—"}</div>
                <div className="small text-primary mt-1">
                  <i className="fa-regular fa-pen-to-square me-1" />
                  Edit profile
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="offcanvas-body py-3 d-flex flex-column">
          <ul className="nav flex-column nc-menu">
            {item("/dashboard", "fa-table-cells-large", "Dashboard")}
            {item("/room", "fa-door-open", "Rooms")}
            {item("/devices", "fa-plug", "Devices")}
            {item("/profile", "fa-user", "Profile")}
          </ul>

          <div className="mt-auto pt-2">
            <div className="d-flex align-items-center justify-content-between px-2 mb-2">
              <div className="d-flex align-items-center gap-2">
                <i className="fa-regular fa-moon" />
                <span>Dark Mode</span>
              </div>
              <div className="form-check form-switch m-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="ncDarkSwitch"
                  onChange={toggle}
                  checked={theme === "dark"}
                />
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline-danger w-100"
              onClick={async () => {
                await signOut(auth);
                hardCloseOffcanvas();
                navigate("/login", { replace: true });
              }}
            >
              <i className="fa-solid fa-right-from-bracket me-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <div
        className="modal fade"
        id="profileEditModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content card-neo">
            <form onSubmit={onSaveProfile}>
              <div className="modal-header">
                <h6 className="modal-title">Edit profile</h6>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>

              <div className="modal-body d-grid gap-3">
                <div>
                  <label className="form-label small text-muted mb-1">
                    Name
                  </label>
                  <input
                    name="nc-name"
                    type="text"
                    className="form-control input-underline"
                    placeholder="Your name"
                    defaultValue={name || fallbackName}
                  />
                </div>

                <div>
                  <label className="form-label small text-muted mb-1">
                    Photo
                  </label>
                  <input
                    name="nc-photo"
                    type="file"
                    accept="image/*"
                    className="form-control"
                  />
                  <div className="small text-muted mt-1">
                    Registered email: <strong>{email}</strong> (cannot change)
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  data-bs-dismiss="modal"
                  type="button"
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
