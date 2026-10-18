// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuth";
import RoutePending from "../components/common/RoutePending";
import { paths } from "./paths";

export default function ProtectedRoute() {
  const { user, loading } = useAuthContext();
  const { pathname, search, hash } = useLocation();

  if (loading) {
    return <RoutePending message="Restoring your session..." />;
  }

  return user ? <Outlet /> : <Navigate to={paths.login} state={{ from: { pathname, search, hash } }} replace />;
}
