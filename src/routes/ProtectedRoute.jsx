// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div
        style={{ minHeight: "60vh" }}
        className="d-flex align-items-center justify-content-center"
      >
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
