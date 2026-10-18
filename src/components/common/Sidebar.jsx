import { paths, isSectionActive } from "../../routes/paths";
import { createElement } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiGrid, FiPower, FiUser, FiLogOut, FiMoon, FiX, FiChevronRight, FiSun } from "react-icons/fi";
import "./Sidebar.css";
import Offcanvas from "bootstrap/js/dist/offcanvas";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuthContext } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { preloadPage } from "../../utils/preloadPages";

export default function Sidebar({ profile }) {
  const { user } = useAuthContext();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const close = () => { const element = document.getElementById("mobileSidebar"); if (element) Offcanvas.getOrCreateInstance(element).hide(); };
  const go = (path) => { close(); navigate(path); };
  const initials = profile.name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return <aside className="offcanvas offcanvas-end nc-offcanvas nova-drawer" tabIndex="-1" id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
    <header className="offcanvas-header drawer-header"><div className="drawer-brand"><span><FiHome /></span><div><h2 id="mobileSidebarLabel">Nova Control</h2><p>Your home, connected.</p></div></div><button className="drawer-close" onClick={close} aria-label="Close navigation"><FiX /></button></header>
    <div className="offcanvas-body drawer-body">
      <div className="drawer-section-heading"><span>YOUR WORKSPACE</span><span className="drawer-home-tag"><FiHome /> Home</span></div>
      <nav className="drawer-navigation" aria-label="Mobile navigation">{[[paths.dashboard,"Dashboard","Your home at a glance",FiGrid],[paths.rooms,"Rooms","Explore your spaces",FiHome],[paths.devices,"Devices","Manage every switch",FiPower],[paths.profile,"Profile","Your account & preferences",FiUser]].map(([path,label,description,ItemIcon]) => <NavLink key={path} to={path} end={path === paths.dashboard} className={isSectionActive(pathname, path) ? "is-current" : ""} onClick={close} onPointerEnter={() => preloadPage(path)} onFocus={() => preloadPage(path)}><span className="drawer-nav-icon">{createElement(ItemIcon)}</span><span className="drawer-nav-copy"><strong>{label}</strong><small>{description}</small></span><FiChevronRight className="drawer-chevron" /></NavLink>)}</nav>
      <div className="drawer-footer">
        <label className="drawer-theme"><span className="drawer-theme-icon">{theme === "dark" ? <FiMoon /> : <FiSun />}</span><span><strong>Appearance</strong><small>{theme === "dark" ? "Dark mode" : "Light mode"}</small></span><input type="checkbox" role="switch" aria-label="Dark mode" checked={theme === "dark"} onChange={toggle} /><span className="drawer-toggle" aria-hidden="true" /></label>
        <button className="drawer-account" onClick={() => go(paths.profile)}><span className="drawer-avatar">{profile.photoURL ? <img key={profile.photoURL} src={profile.photoURL} alt="" /> : initials}</span><span className="drawer-account-copy"><strong>{profile.name}</strong><small>{user.email}</small></span><FiChevronRight /></button>
        <button className="drawer-signout" onClick={async () => { try { close(); await signOut(auth); navigate(paths.login, {replace:true}); } catch { window.alert("Unable to sign out. Please try again."); } }}><FiLogOut /> Sign out</button>
      </div>
    </div>
  </aside>;
}
