import { lazy } from "react";
import { useRoutes } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import RoomsLayout from "./layouts/RoomsLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";
import { HomeRedirect, LegacyRedirect } from "./routes/Redirects";
import { routeTree } from "./routes/routeTree";
import { paths } from "./routes/paths";
import { pageLoaders } from "./utils/preloadPages";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const AppLayout = lazy(() => import("./layouts/AppLayout"));
const Dashboard = lazy(pageLoaders[paths.dashboard]);
const Rooms = lazy(pageLoaders[paths.rooms]);
const RoomDevices = lazy(pageLoaders.roomDevices);
const Devices = lazy(pageLoaders[paths.devices]);
const Profile = lazy(pageLoaders[paths.profile]);

const elements = {
  root: <RootLayout />,
  home: <HomeRedirect />,
  guest: <GuestRoute />,
  login: <Login />,
  protected: <ProtectedRoute />,
  workspace: <AppLayout />,
  dashboard: <Dashboard />,
  "rooms-layout": <RoomsLayout />,
  rooms: <Rooms />,
  "room-devices": <RoomDevices />,
  devices: <Devices />,
  profile: <Profile />,
  "workspace-not-found": <NotFound />,
  "not-found": <NotFound />,
};

function buildRoutes(nodes) {
  return nodes.map((node) => ({
    ...node,
    element: node.id.startsWith("legacy-") ? <LegacyRedirect /> : elements[node.id],
    ...(node.children ? { children: buildRoutes(node.children) } : {}),
  }));
}
const routes = buildRoutes(routeTree);

export default function App() { return useRoutes(routes); }
