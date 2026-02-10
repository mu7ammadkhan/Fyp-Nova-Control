// src/components/common/Navbar.jsx
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuthContext } from "../../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import Sidebar from "./Sidebar";
import LoginSidebar from "./LoginSidebar";
import { useEffect, useMemo, useState } from "react";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UNSIGNED_PRESET = "smart_home_preset_67";
const UPLOAD_URL = CLOUD_NAME
  ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
  : null;

export default function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, loading } = useAuthContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isDark = theme === "dark";

  // ✅ App pages where logged-in sidebar should open
  const onApp =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/room") ||
    pathname === "/devices" ||
    pathname === "/profile";

  // ✅ Decide which offcanvas should open
  const sideTarget = user && onApp ? "#mobileSidebar" : "#loginSidebar";

  const onLogout = async () => {
    await signOut(auth);
    navigate("/login", { replace: true });
  };

  // -------- Profile dropdown state (desktop) ----------
  const [profile, setProfile] = useState({ name: "", photoURL: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pError, setPError] = useState("");

  // Fetch/create user doc
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user) return;
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (!mounted) return;

        if (snap.exists()) {
          const data = snap.data();
          setProfile({
            name: data?.name || user.email?.split("@")[0] || "",
            photoURL: data?.photoURL || "",
          });
        } else {
          await setDoc(ref, {
            email: user.email,
            name: user.email?.split("@")[0] || "",
            photoURL: "",
            createdAt: Date.now(),
          });
          setProfile({
            name: user.email?.split("@")[0] || "",
            photoURL: "",
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  const initials = useMemo(() => {
    if (!profile?.name) return "U";
    return profile.name
      .trim()
      .split(" ")
      .map((p) => p[0]?.toUpperCase())
      .slice(0, 2)
      .join("");
  }, [profile?.name]);

  const uploadAvatar = async (file) => {
    if (!file) return;

    if (!UPLOAD_URL) {
      setPError("Cloudinary config missing. Add VITE_CLOUDINARY_CLOUD_NAME in .env.");
      return;
    }

    setPError("");
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", UNSIGNED_PRESET);
      form.append("folder", "profile_pics");

      const res = await fetch(UPLOAD_URL, { method: "POST", body: form });
      const json = await res.json();

      if (json?.secure_url) {
        setProfile((p) => ({ ...p, photoURL: json.secure_url }));
      } else {
        throw new Error(json?.error?.message || "Upload failed");
      }
    } catch (e) {
      setPError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setSaving(true);
    setPError("");

    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        name: profile.name || "",
        photoURL: profile.photoURL || "",
        updatedAt: Date.now(),
      });
    } catch (e) {
      console.error(e);
      setPError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <nav
        className={`navbar shadow-sm nav-3d sticky-top ${isDark ? "navbar-dark" : "navbar-light"}`}
      >
        <div className="container d-flex align-items-center">
          {/* Brand */}
          <Link
            className="navbar-brand d-flex align-items-center gap-2"
            to={user ? "/dashboard" : "/login"}
          >
            <span className="brand-icon d-inline-grid place-items-center">
              <i className="fa-solid fa-house"></i>
            </span>
            <span className="fw-bold">Nova Control</span>
          </Link>

          {/* Center links only when auth loaded & logged-in */}
          {!loading && user && (
            <ul className="dash-nav d-none d-lg-flex list-unstyled m-0 p-0 mx-auto">
              <li className="nav-item">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => "nav-link dash-link" + (isActive ? " active" : "")}
                >
                  Dashboard
                </NavLink>
              </li>

              <li className="nav-item">
                {/* ✅ Use real route */}
                <NavLink
                  to="/room"
                  className={({ isActive }) => "nav-link dash-link" + (isActive ? " active" : "")}
                >
                  Rooms
                </NavLink>
              </li>

              <li className="nav-item">
                {/* ✅ Real route */}
                <NavLink
                  to="/devices"
                  className={({ isActive }) => "nav-link dash-link" + (isActive ? " active" : "")}
                >
                  Devices
                </NavLink>
              </li>

              {/* Desktop PROFILE DROPDOWN CARD */}
              <li className="nav-item dropdown d-none d-lg-block">
                <button
                  className="nav-link dash-link dropdown-toggle bg-transparent border-0"
                  id="profileMenuBtn"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Profile
                </button>

                <div
                  className="dropdown-menu dropdown-menu-end p-3 border-0 shadow-lg profile-card-dropdown"
                  aria-labelledby="profileMenuBtn"
                >
                  {/* Top: avatar + name + email */}
                  <div className="d-flex align-items-center gap-3">
                    {profile.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt="avatar"
                        className="rounded-circle object-fit-cover"
                        width="56"
                        height="56"
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-secondary-subtle d-flex align-items-center justify-content-center"
                        style={{ width: 56, height: 56, fontWeight: 700 }}
                      >
                        {initials}
                      </div>
                    )}

                    <div className="flex-grow-1">
                      <div className="fw-semibold">{profile.name || "User"}</div>
                      <div className="text-muted small">{user?.email}</div>
                    </div>
                  </div>

                  <hr className="my-3" />

                  {/* Name input */}
                  <div className="mb-2">
                    <label className="form-label small text-muted mb-1">Name</label>
                    <input
                      className="form-control"
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Your name"
                    />
                  </div>

                  {/* Photo upload */}
                  <div className="mb-2">
                    <label className="form-label small text-muted mb-1">Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={(e) => uploadAvatar(e.target.files?.[0])}
                      disabled={uploading}
                    />
                    {uploading && <div className="small text-muted mt-1">Uploading…</div>}
                  </div>

                  {pError && <div className="alert alert-danger py-2 small mb-2">{pError}</div>}

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-primary flex-grow-1"
                      onClick={saveProfile}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>

                    <NavLink to="/profile" className="btn btn-outline-secondary">
                      Full Profile
                    </NavLink>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <button
                      className="btn btn-outline-secondary icon-btn"
                      onClick={toggle}
                      aria-label={isDark ? "Switch to light" : "Switch to dark"}
                      title={isDark ? "Light" : "Dark"}
                    >
                      <i className={isDark ? "fa-solid fa-sun" : "fa-solid fa-moon"} />
                    </button>

                    <button className="btn btn-outline-danger" onClick={onLogout}>
                      Logout
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          )}

          <div className="d-flex align-items-center gap-2 ms-auto">
            {/* Admin panel visible only when not inside app */}
            {(!user || !onApp) && (
              <NavLink
                className="btn btn-link no-underline d-none d-sm-inline-flex align-items-center"
                to="/admin-login"
              >
                <i className="fa-solid fa-shield-halved" />
                <span className="ms-1">Admin Panel</span>
              </NavLink>
            )}

            {/* Theme toggle (md+) */}
            <button
              className="btn btn-outline-secondary d-none d-md-inline-flex align-items-center justify-content-center"
              style={{ width: "40px", height: "40px", padding: 0 }}
              onClick={toggle}
              aria-label={isDark ? "Switch to light" : "Switch to dark"}
              title={isDark ? "Light" : "Dark"}
            >
              <i className={isDark ? "fa-solid fa-sun" : "fa-solid fa-moon"} />
            </button>

            {/* Mobile hamburger */}
            <button
              className="btn btn-outline-secondary d-lg-none align-items-center justify-content-center"
              style={{ width: "40px", height: "40px", padding: 0 }}
              data-bs-toggle="offcanvas"
              data-bs-target={sideTarget}
              aria-controls={sideTarget.replace("#", "")}
              aria-label="Open menu"
            >
              <i className="fa-solid fa-bars"></i>
            </button>

            {/* Logout (desktop) */}
            {!loading && user && (
              <button
                className="btn btn-outline-danger d-none d-lg-inline-flex"
                onClick={onLogout}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebars */}
      {user ? <Sidebar /> : <LoginSidebar />}
    </>
  );
}
