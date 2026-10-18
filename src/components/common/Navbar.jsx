import { paths } from "../../routes/paths";
import "../../manage.css";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiHome, FiSun, FiMoon, FiMenu, FiUser, FiChevronDown, FiLogOut, FiArrowUpRight, FiMail, FiX } from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useTheme } from "../../hooks/useTheme";
import { useAuthContext } from "../../hooks/useAuth";
import { useHomeData } from "../../hooks/useHomeData";
import { preloadPage } from "../../utils/preloadPages";
import Sidebar from "./Sidebar";

export default function Navbar() {
  const { user } = useAuthContext();
  const { theme, toggle } = useTheme();
  const { profile, profileError } = useHomeData(user.uid);
  const [open, setOpen] = useState(false);
  const popup = useRef(null);
  const trigger = useRef(null);
  const navigate = useNavigate();
  const name = profile?.name || user.displayName || user.email?.split("@")[0] || "Your account";
  const photo = profile?.photoURL || user.photoURL;
  const initials = name.trim().split(/\s+/).map((part) => part[0]).slice(0,2).join("").toUpperCase();
  const logout = async () => { try { await signOut(auth); navigate(paths.login, { replace:true }); } catch { window.alert("Unable to sign out. Please try again."); } };
  useEffect(() => {
    const timer = setTimeout(() => preloadPage(paths.rooms), 200);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!open) return;
    const outside = (event) => { if (!popup.current?.contains(event.target) && !trigger.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <>
    <nav className="navbar nav-3d sticky-top" aria-label="Main navigation"><div className="container">
      <Link className="navbar-brand d-flex align-items-center gap-2" to={paths.dashboard}><span className="brand-icon"><FiHome /></span><span className="fw-bold">Nova Control</span></Link>
      <div className="main-nav-links d-none d-lg-flex">{[[paths.dashboard,"Dashboard"],[paths.rooms,"Rooms"],[paths.devices,"Devices"]].map(([path,label]) => <NavLink key={path} to={path} end={path === paths.dashboard} onPointerEnter={() => preloadPage(path)} onFocus={() => preloadPage(path)}>{label}</NavLink>)}</div>
      <div className="account-nav ms-auto">
        <button className="manage-icon-button theme-button" onClick={toggle} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}>{theme === "dark" ? <FiSun /> : <FiMoon />}</button>
        <div className="account-menu" onBlur={(event) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
          <button ref={trigger} className="account-trigger" aria-expanded={open} aria-haspopup="dialog" aria-controls="account-popover" onClick={() => setOpen((value) => !value)} onPointerEnter={() => preloadPage(paths.profile)} onFocus={() => preloadPage(paths.profile)}><span className="account-avatar">{photo ? <img src={photo} alt="" width="34" height="34" /> : initials}</span><span className="account-trigger-label">Profile</span><FiChevronDown /></button>
          {open && <section ref={popup} id="account-popover" className="account-popover" role="dialog" aria-label="Your profile"><header><span>Your account</span><button className="manage-icon-button" aria-label="Close profile card" onClick={() => { setOpen(false); trigger.current?.focus(); }}><FiX /></button></header><div className="account-identity"><span className="account-avatar account-avatar-large">{photo ? <img src={photo} alt="" width="64" height="64" /> : initials}</span><h2>{name}</h2><p><FiMail />{user.email}</p></div>{profileError && <p className="control-error" role="alert">{profileError}</p>}<div className="account-detail"><FiUser /><span>Personal workspace</span><span className="account-badge">Member</span></div><Link className="workspace-button" to={paths.profile} onClick={() => setOpen(false)}>View & edit profile <FiArrowUpRight /></Link><button className="account-signout" onClick={logout}><FiLogOut /> Sign out</button></section>}
        </div>
        <button className="manage-icon-button d-lg-none" data-bs-toggle="offcanvas" data-bs-target="#mobileSidebar" aria-controls="mobileSidebar" aria-label="Open navigation"><FiMenu /></button>
      </div>
    </div></nav>
    <Sidebar profile={{name, photoURL:photo}} />
  </>;
}
