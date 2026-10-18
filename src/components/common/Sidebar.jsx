import { paths, isSectionActive } from "../../routes/paths";
import { createElement } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiGrid, FiPower, FiUser, FiLogOut, FiMoon, FiX } from "react-icons/fi";
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
  return <aside className="offcanvas offcanvas-end nc-offcanvas" tabIndex="-1" id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
    <header className="offcanvas-header"><h2 id="mobileSidebarLabel" className="sidebar-title"><FiHome /> Nova Control</h2><button className="manage-icon-button" onClick={close} aria-label="Close navigation"><FiX /></button></header>
    <div className="offcanvas-body sidebar-body"><button className="sidebar-account" onClick={() => go(paths.profile)}><span className="account-avatar">{profile.photoURL ? <img src={profile.photoURL} alt="" /> : profile.name[0]}</span><span><strong>{profile.name}</strong><small>{user.email}</small></span></button>
      <nav className="sidebar-links" aria-label="Mobile navigation">{[[paths.dashboard,"Dashboard",FiGrid],[paths.rooms,"Rooms",FiHome],[paths.devices,"Devices",FiPower],[paths.profile,"Profile",FiUser]].map(([path,label,ItemIcon]) => <NavLink key={path} to={path} end={path === paths.dashboard} className={isSectionActive(pathname, path) ? "active" : ""} onClick={close} onPointerEnter={() => preloadPage(path)} onFocus={() => preloadPage(path)}>{createElement(ItemIcon)}{label}</NavLink>)}</nav>
      <div className="sidebar-bottom"><label><FiMoon /> Dark mode<input type="checkbox" checked={theme === "dark"} onChange={toggle} /></label><button className="account-signout" onClick={async () => { try { close(); await signOut(auth); navigate(paths.login, {replace:true}); } catch { window.alert("Unable to sign out. Please try again."); } }}><FiLogOut /> Sign out</button></div>
    </div>
  </aside>;
}
