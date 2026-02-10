// src/pages/AdminLogin.jsx
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const eTrim = email.trim();
      const pTrim = pass.trim();

      await setPersistence(auth, browserLocalPersistence);

      const { user } = await signInWithEmailAndPassword(auth, eTrim, pTrim);

      if (ADMIN_EMAIL && eTrim === ADMIN_EMAIL) {
        window.location.href = "/admin";
      } else {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.exists() ? snap.data()?.role : "user";
        if (role === "admin") {
          window.location.href = "/admin";
        } else {
          setMsg("This account is not an admin.");
          await signOut(auth);
        }
      }
    } catch (err) {
      setMsg(humanAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-center page-fade">
      <div className="auth-card">
        <div className="card card-neo p-4 p-md-5">
          <div className="text-center mb-3">
            <div className="card-brand-chip mx-auto mb-1">
              <i className="fa-solid fa-house" />
            </div>
            <div className="brand-title">Nova Control</div>
          </div>

          <form onSubmit={handleSubmit} className="d-grid gap-3">
            <div>
              <label className="form-label small text-muted mb-1">Admin Email</label>
              <input
                type="email"
                className="form-control input-underline"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-with-toggle">
              <label className="form-label small text-muted mb-1">Password</label>
              <input
                type={showPass ? "text" : "password"}
                className="form-control input-underline with-toggle"
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                <i className={showPass ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"} />
              </button>
            </div>

            <button className="btn btn-primary btn-lg rounded-pill" type="submit" disabled={busy}>
              {busy ? "Logging in..." : "Login as Admin"}
            </button>
            {msg && <div className="alert alert-info mb-0">{msg}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

function humanAuthError(err) {
  const code = String(err.code || "").toLowerCase();
  if (code.includes("user-not-found")) return "Email not registered.";
  if (code.includes("invalid-email")) return "Invalid email address.";
  if (code.includes("wrong-password")) return "Wrong password.";
  if (code.includes("too-many-requests")) return "Too many attempts, try later.";
  return err.message || "Something went wrong.";
}
