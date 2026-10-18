import "../manage.css";
import "../profile.css";
import { createElement, useEffect, useRef, useState } from "react";
import { FiUser, FiMail, FiCamera, FiCheck, FiSave, FiSun, FiMoon, FiSliders, FiCalendar, FiUploadCloud, FiHome } from "react-icons/fi";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth } from "../lib/firebase";
import { db } from "../lib/database";
import { useAuthContext } from "../hooks/useAuth";
import { useHomeData } from "../hooks/useHomeData";
import { useTheme } from "../hooks/useTheme";
import { resizeImageToBlob } from "../utils/image";
import { uploadToCloudinary } from "../utils/cloudinary";

export default function Profile() {
  const { user } = useAuthContext();
  const { theme, toggle } = useTheme();
  const { profile, profileLoaded, profileError } = useHomeData(user.uid);
  const savedName = profile?.name || user.displayName || user.email?.split("@")[0] || "";
  const savedPhoto = profile?.photoURL ?? user.photoURL ?? "";
  const [activeTab, setActiveTab] = useState("personal");
  const [draftName, setDraftName] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInput = useRef(null);
  const name = draftName ?? savedName;
  const dirty = !!file || (draftName !== null && name.trim() !== savedName);
  const initials = (savedName || "U").trim().split(/\s+/).map((part) => part[0]).slice(0,2).join("").toUpperCase();
  const joined = user.metadata?.creationTime ? new Intl.DateTimeFormat("en", { month:"long", year:"numeric" }).format(new Date(user.metadata.creationTime)) : null;
  const providers = user.providerData?.map((provider) => ({password:"Email & password", "google.com":"Google", "github.com":"GitHub"}[provider.providerId] || provider.providerId)).join(", ") || "Email";
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const clearSelection = () => { setFile(null); setPreview(""); if (fileInput.current) fileInput.current.value=""; };
  const cancel = () => { setDraftName(null); clearSelection(); setError(""); setSuccess(""); };
  const save = async (event) => {
    event.preventDefault(); setError(""); setSuccess("");
    if (!name.trim()) { setError("Please enter your full name."); return; }
    setSaving(true);
    try {
      const photoURL = file ? await uploadToCloudinary(await resizeImageToBlob(file)) : savedPhoto;
      await setDoc(doc(db,"users",user.uid), {name:name.trim(),photoURL,email:user.email,updatedAt:Date.now()}, {merge:true});
      await updateProfile(auth.currentUser, {displayName:name.trim(), photoURL:photoURL || null});
      setDraftName(null); clearSelection(); setSuccess("Your changes have been saved.");
    } catch { setError("We couldn’t save your changes. Check your connection and try again."); }
    finally { setSaving(false); }
  };
  const chooseFile = (event) => {
    const selected = event.target.files?.[0]; setError(""); setSuccess("");
    if (!selected) return;
    if (!["image/jpeg","image/png","image/webp"].includes(selected.type) || selected.size > 5*1024*1024) {
      clearSelection(); setError("Choose a JPG, PNG or WebP image smaller than 5 MB."); return;
    }
    setFile(selected); setPreview(URL.createObjectURL(selected));
  };
  const avatar = (photo, label) => photo ? <img src={photo} alt={label} width="88" height="88" /> : <span aria-label={label}>{initials}</span>;
  return <main className="container manage-page profile-page">
    <header className="profile-page-heading"><div><span className="workspace-eyebrow">MAKE IT YOURS</span><h1>My profile</h1><p>Your personal space in Nova Control.</p></div></header>
    <div className="profile-workspace">
      <aside className="profile-passport" aria-label="Your profile summary"><div className="passport-brand"><FiHome /><span>NOVA CONTROL</span></div><div className="passport-avatar">{avatar(savedPhoto,"Your profile")}</div><h2>{savedName || "Your account"}</h2><p className="passport-email">{user.email}</p><span className="passport-badge"><FiUser /> Personal account</span><div className="passport-divider" /><dl><div><dt><FiMail /> Sign-in method</dt><dd>{providers}</dd></div>{joined && <div><dt><FiCalendar /> Member since</dt><dd>{joined}</dd></div>}</dl><p className="passport-note">One profile for your connected home.</p></aside>
      <section className="profile-editor-card"><header className="profile-editor-heading"><div><h2>Account settings</h2><p>Update your details and make yourself at home.</p></div><span className="profile-editor-symbol"><FiSliders /></span></header>
        <nav className="profile-section-tabs" aria-label="Profile sections"><button aria-pressed={activeTab === "personal"} onClick={() => setActiveTab("personal")}><FiUser />Personal information</button><button aria-pressed={activeTab === "preferences"} onClick={() => setActiveTab("preferences")}><FiSliders />Preferences</button></nav>
        <div className="profile-tab-panel" hidden={activeTab !== "personal"}>
          {(profileError || error) && <div className="manage-notice" role="alert">{error || profileError}</div>}{success && <div className="manage-notice notice-success" role="status"><FiCheck /> {success}</div>}
          <form onSubmit={save} aria-busy={saving}><div className="profile-photo-strip"><div className="profile-photo-preview">{avatar(preview || savedPhoto,"Selected profile photo")}<span><FiCamera /></span></div><div className="profile-photo-copy"><h3>Profile photo</h3><p>JPG, PNG or WebP. Maximum 5 MB.</p><div className="profile-photo-controls"><label className="profile-upload-action"><FiUploadCloud />{file ? "Change selection" : "Upload photo"}<input ref={fileInput} id="profile-photo" aria-label="Upload profile photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} disabled={saving || !profileLoaded} /></label>{file && <button type="button" className="profile-clear-photo" onClick={clearSelection} disabled={saving}>Remove selection</button>}</div>{file && <small className="profile-file-name">{file.name}</small>}</div></div>
            <div className="profile-form-grid"><div className="profile-form-field"><label htmlFor="profile-name">Full name</label><div className="profile-field-input"><FiUser /><input id="profile-name" value={name} onChange={(event) => {setDraftName(event.target.value);setSuccess("");}} required maxLength={100} disabled={saving || !profileLoaded} autoComplete="name" placeholder="Enter your full name" /></div><small>This name appears on your dashboard.</small></div><div className="profile-form-field"><label htmlFor="profile-email">Email address</label><div className="profile-field-input field-readonly"><FiMail /><input id="profile-email" value={user.email || ""} readOnly type="email" /></div><small>Your registered sign-in email.</small></div></div>
            <div className="profile-account-caption"><FiMail /><div><strong>{user.emailVerified ? "Email verified" : "Account email"}</strong><p>{user.emailVerified ? "Your sign-in email has been verified." : "Your email is managed by your sign-in provider."}</p></div></div>
            <footer className="profile-form-footer"><span>{saving ? "Saving changes..." : !profileLoaded ? "Loading profile..." : profileError ? "Profile sync needs attention." : dirty ? "Unsaved changes" : "All changes saved"}</span><div><button className="manage-secondary" type="button" disabled={saving || !dirty} onClick={cancel}>Cancel</button><button className="workspace-button" disabled={saving || !profileLoaded || !dirty}><FiSave />{saving ? "Saving..." : "Save changes"}</button></div></footer>
          </form>
        </div>
        <div className="profile-tab-panel" hidden={activeTab !== "preferences"}><div className="profile-preferences-heading"><h3>Choose your appearance</h3><p>Pick a theme that feels comfortable. Your choice saves automatically.</p></div><div className="profile-themes" role="group" aria-label="Workspace theme">{[["light","Light",FiSun],["dark","Dark",FiMoon]].map(([value,label,ThemeIcon]) => <button key={value} className={"profile-theme theme-"+value} aria-pressed={theme === value} onClick={() => {if(theme !== value) toggle();}}><span className="profile-theme-mock" aria-hidden="true"><i /><span><b /><b /><b /></span></span><span className="profile-theme-title"><span>{createElement(ThemeIcon)}{label}</span><span className="profile-theme-check">{theme === value && <FiCheck />}</span></span></button>)}</div><p className="profile-theme-note"><FiCheck /> Theme applies across your workspace.</p></div>
      </section>
    </div>
  </main>;
}
