// FILE: src/routes/AdminRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import useAdmin from "../hooks/useAdmin";

/**
 * Guards admin-only pages.
 * - If not logged in → /admin-login
 * - If logged in but not admin → /admin-login
 * - Otherwise render children or <Outlet />
 */
export default function AdminRoute({ children }) {
  const { user, loading } = useAuthContext();
  const { isAdmin, loading: adminLoading } = useAdmin();

  if (loading || adminLoading) {
    return <div className="container py-4">Loading…</div>;
  }

  if (!user) return <Navigate to="/admin-login" replace />;

  if (!isAdmin) return <Navigate to="/admin-login" replace />;

  return children ? children : <Outlet />;
}
