// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuthContext } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Forgot password
  const [fpEmail, setFpEmail] = useState("");
  const [fpMsg, setFpMsg] = useState("");
  const [fpBusy, setFpBusy] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuthContext();

  // If already logged in → go to dashboard
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const blurActive = () => {
    try {
      document.activeElement?.blur();
    } catch {}
  };

  const onLogin = async (e) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    try {
      const eTrim = email.trim();
      const pTrim = pass.trim();

      // ✅ Persist login across refresh
      await setPersistence(auth, browserLocalPersistence);

      await signInWithEmailAndPassword(auth, eTrim, pTrim);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setMsg(humanAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    setFpMsg("");
    const eTrim = fpEmail.trim().toLowerCase();
    if (!eTrim) return setFpMsg("Please enter your email first.");
    setFpBusy(true);

    try {
      let methods = [];
      try {
        methods = await fetchSignInMethodsForEmail(auth, eTrim);
      } catch {}

      if (methods && methods.length > 0) {
        await sendPasswordResetEmail(auth, eTrim);
        setFpMsg("Password reset link sent ✅ (check Inbox/Spam)");
      } else {
        try {
          await sendPasswordResetEmail(auth, eTrim);
          setFpMsg("Password reset link sent ✅ (check Inbox/Spam)");
        } catch (err) {
          const code = String(err.code || "").toLowerCase();
          if (code.includes("user-not-found")) setFpMsg("Email not registered.");
          else if (code.includes("invalid-email")) setFpMsg("Invalid email address.");
          else if (code.includes("too-many-requests")) setFpMsg("Too many attempts, try later.");
          else setFpMsg(err.message || "Something went wrong.");
        }
      }
    } finally {
      setFpBusy(false);
    }
  };

  return (
    <div className="page-center page-fade">
      <div className="auth-card">
        <div className="card card-neo p-4 p-md-5">
          {/* Brand */}
          <div className="text-center mb-3">
            <div className="card-brand-chip mx-auto mb-1">
              <i className="fa-solid fa-house" />
            </div>
            <div className="brand-title">Nova Control</div>
          </div>

          <form onSubmit={onLogin} className="d-grid gap-3">
            <div>
              <label className="form-label small text-muted mb-1">Email</label>
              <input
                type="email"
                className="form-control input-underline"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-with-toggle">
              <label className="form-label small text-muted mb-1">Password</label>
              <input
                type={showPass ? "text" : "password"}
                className="form-control input-underline with-toggle"
                placeholder=""
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                autoComplete="current-password"
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

            <div className="d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-link p-0"
                data-bs-toggle="modal"
                data-bs-target="#forgotModal"
                onClick={() => {
                  setFpEmail(email.trim());
                  setFpMsg("");
                  blurActive();
                }}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary btn-lg rounded-pill" disabled={busy}>
              {busy ? "Logging in..." : "Login"}
            </button>

            {msg && <div className="alert alert-info mb-0 mt-2">{msg}</div>}
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <div
        className="modal fade"
        id="forgotModal"
        tabIndex="-1"
        aria-hidden="true"
        data-bs-backdrop="static"
        data-bs-keyboard="false"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content card-neo">
            <div className="modal-header">
              <h6 className="modal-title">Reset password</h6>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={blurActive}
              />
            </div>

            <div className="modal-body">
              <label className="form-label small text-muted mb-1">Registered email</label>
              <input
                type="email"
                className="form-control input-underline"
                placeholder="you@example.com"
                value={fpEmail}
                onChange={(e) => setFpEmail(e.target.value)}
              />
              {fpMsg && <div className="alert alert-info mt-3 mb-0">{fpMsg}</div>}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline-secondary"
                data-bs-dismiss="modal"
                disabled={fpBusy}
                onClick={blurActive}
              >
                Close
              </button>

              <button className="btn btn-primary" onClick={handleForgot} disabled={fpBusy}>
                {fpBusy ? "Sending..." : "Send Link"}
              </button>
            </div>
          </div>
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
