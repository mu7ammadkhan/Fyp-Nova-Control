// src/components/common/LoginSidebar.jsx
import { NavLink } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export default function LoginSidebar() {
  const { theme, toggle } = useTheme();

  const closeOffcanvas = () => {
    const el = document.getElementById("loginSidebar");
    const bs = window.bootstrap;
    if (el && bs?.Offcanvas) {
      const oc = bs.Offcanvas.getInstance(el) || new bs.Offcanvas(el);
      oc.hide();
    }
    // focus blur to avoid weird mobile focus issues
    try { document.activeElement?.blur(); } catch {}
  };

  return (
    <div
      className="offcanvas offcanvas-end nc-offcanvas"
      tabIndex="-1"
      id="loginSidebar"
      aria-labelledby="loginSidebarLabel"
    >
      <div className="offcanvas-header pb-2">
        <div className="d-flex align-items-center gap-2">
          <span className="brand-icon d-inline-grid place-items-center">
            <i className="fa-solid fa-house" />
          </span>
          <h6 className="offcanvas-title m-0 fw-bold" id="loginSidebarLabel">
            Nova Control
          </h6>
        </div>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
          onClick={closeOffcanvas}
        />
      </div>

      <div className="offcanvas-body py-3 d-flex flex-column">
        <ul className="nav flex-column nc-menu">
          <li className="nav-item nc-anim">
            <NavLink
              to="/admin-login"
              className="nav-link nc-link d-flex align-items-center gap-2"
              onClick={closeOffcanvas}
            >
              <i className="fa-solid fa-shield-halved me-2" />
              <span>Admin Panel</span>
            </NavLink>
          </li>
        </ul>

        <div className="mt-auto pt-2">
          <div className="d-flex align-items-center justify-content-between px-2 mb-2 nc-anim">
            <div className="d-flex align-items-center gap-2">
              <i className="fa-regular fa-moon" />
              <span>Dark Mode</span>
            </div>
            <div className="form-check form-switch m-0">
              <input
                className="form-check-input"
                type="checkbox"
                id="ncDarkSwitchLogin"
                onChange={toggle}
                checked={theme === "dark"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
