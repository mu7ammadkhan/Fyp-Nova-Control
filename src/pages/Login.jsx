import { getReturnTo } from "../routes/returnTo";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserLocalPersistence } from "firebase/auth";
import { FiHome, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiArrowLeft } from "react-icons/fi";
import { auth } from "../lib/firebase";
import { useAuthContext } from "../hooks/useAuth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [reset, setReset] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { state: navigationState } = useLocation();
  const { loading: authLoading } = useAuthContext();

  const submit = async (event) => {
    event.preventDefault();
    setError(""); setMsg(""); setBusy(true);
    try {
      if (reset) {
        await sendPasswordResetEmail(auth, email.trim());
        setMsg("If an account exists for this email, a reset link will arrive shortly. Please check your inbox and spam folder.");
      } else {
        await setPersistence(auth, browserLocalPersistence);
        await signInWithEmailAndPassword(auth, email.trim(), pass);
        navigate(getReturnTo(navigationState?.from), { replace: true });
      }
    } catch (err) { setError(humanAuthError(err)); }
    finally { setBusy(false); }
  };
  const changeMode = () => { setReset((value) => !value); setError(""); setMsg(""); };

  return (
    <main className="login-page">
      <section className="login-form-side" aria-labelledby="login-title">
        <div className="login-form-wrap">
          <header className="login-heading"><h1 id="login-title">{reset ? "Reset password" : "Welcome back"}</h1><p>{reset ? "Let’s help you get back to your home." : "Sign in to manage your connected home."}</p></header>
          <form className="login-form" onSubmit={submit} aria-busy={busy}>
            <div className="login-field"><label htmlFor="login-email">Email address</label><div className="login-input-wrap"><FiMail aria-hidden="true" /><input id="login-email" type="email" placeholder="Enter your email address" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} /></div></div>
            {!reset && <div className="login-field"><label htmlFor="login-password">Password</label><div className="login-input-wrap"><FiLock aria-hidden="true" /><input id="login-password" type={showPass ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" required value={pass} onChange={(event) => setPass(event.target.value)} disabled={busy} /><button className="login-eye" type="button" onClick={() => setShowPass((value) => !value)} aria-label={showPass ? "Hide password" : "Show password"} aria-pressed={showPass}>{showPass ? <FiEyeOff /> : <FiEye />}</button></div><button className="login-forgot" type="button" onClick={changeMode} disabled={busy}>Forgot password?</button></div>}
            {error && <div className="login-message is-error" role="alert">{error}</div>}
            {msg && <div className="login-message" role="status">{msg}</div>}
            <button className="login-submit" type="submit" disabled={busy || authLoading}>{busy ? <><span className="spinner-border spinner-border-sm" aria-hidden="true" /> {reset ? "Sending link…" : "Signing in…"}</> : <>{reset ? "Send reset link" : "Sign In"}<FiArrowRight /></>}</button>
            {reset && <button className="login-back" type="button" onClick={changeMode} disabled={busy}><FiArrowLeft /> Back to sign in</button>}
          </form>
          <p className="login-secure"><FiShield /> Your home. Your access. Securely connected.</p>
        </div>
      </section>
      <aside className="login-story">
        <div className="login-story-brand"><span className="login-story-symbol"><FiHome /></span><div><strong>Nova Control</strong><span>Your Smart Home Partner</span></div></div>
        <div className="login-story-copy"><span className="login-eyebrow">YOUR HOME, CONNECTED</span><h2 aria-label="Smart Living. Clear Control."><span className="login-type-line login-type-first" aria-hidden="true">Smart Living.</span><span className="login-type-line login-type-second" aria-hidden="true">Clear Control.</span></h2><p>Every room. Every device. Everything you need<br className="login-desktop-break" /> to feel at home, in one simple workspace.</p><span className="login-story-rule" /></div>
        <footer className="login-story-footer"><div><span>BUILT FOR EVERYDAY LIVING</span><strong>One home. One workspace.</strong></div></footer>
      </aside>
    </main>
  );
}
function humanAuthError(err) {
  const code = String(err.code || "");
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(code)) return "The email or password is incorrect. Please try again.";
  if (code === "auth/invalid-email") return "Please enter a valid email address.";
  if (code === "auth/too-many-requests") return "Too many attempts. Please wait a moment and try again.";
  if (code === "auth/network-request-failed") return "Unable to connect. Please check your internet connection.";
  if (code === "auth/user-disabled") return "This account is disabled. Please contact your administrator.";
  return "We couldn’t complete your request. Please try again.";
}
