// FILE: src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/common/Navbar";

// Auth (user)
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Guards
import ProtectedRoute from "./routes/ProtectedRoute";

// Rooms & Devices
import RoomsPage from "./pages/Room";
import RoomDevices from "./pages/RoomDevices";
import DevicesPage from "./pages/Devices";

import { useAuthContext } from "./context/AuthContext";

export default function App() {
  const { user } = useAuthContext();

  return (
    <>
      <Navbar />

      <Routes>
        {/* Default → /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login: if already logged-in, send to dashboard */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* ===== User area (protected) ===== */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Rooms list */}
          <Route path="/room" element={<RoomsPage />} />
          {/* Backward-compat for your current link: /dashboard/rooms → /room */}
          <Route
            path="/dashboard/rooms"
            element={<Navigate to="/room" replace />}
          />

          {/* Single room → devices inside that room */}
          <Route path="/room/:roomId" element={<RoomDevices />} />

          {/* Global devices page */}
          <Route path="/devices" element={<DevicesPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}``