import { Outlet } from "react-router-dom";

// Rooms index and room-specific device controls share the workspace session.
export default function RoomsLayout() { return <Outlet />; }
