import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuth";
import { getReturnTo } from "./returnTo";

export default function GuestRoute() {
  const { user } = useAuthContext();
  const { state } = useLocation();
  return user ? <Navigate to={getReturnTo(state?.from)} replace /> : <Outlet />;
}
