import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuth";
import { canonicalPath, paths } from "./paths";
import RoutePending from "../components/common/RoutePending";

export function HomeRedirect() {
  const { user, loading } = useAuthContext();
  if (loading) return <RoutePending />;
  return <Navigate to={user ? paths.dashboard : paths.login} replace />;
}

export function LegacyRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={canonicalPath(pathname) + search + hash} replace />;
}
