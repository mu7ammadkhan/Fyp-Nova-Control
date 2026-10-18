import { paths, canonicalPath } from "../routes/paths";

// The router and hover preloading share the same lazy module loaders.
export const pageLoaders = {
  [paths.dashboard]: () => import("../pages/Dashboard"),
  [paths.rooms]: () => import("../pages/Room"),
  [paths.devices]: () => import("../pages/Devices"),
  [paths.profile]: () => import("../pages/Profile"),
  roomDevices: () => import("../pages/RoomDevices"),
};
export function preloadPage(path) {
  const canonical = canonicalPath(path);
  const load = pageLoaders[canonical] || (canonical.startsWith(paths.rooms + "/") ? pageLoaders.roomDevices : undefined);
  return load?.().catch(() => undefined);
}
