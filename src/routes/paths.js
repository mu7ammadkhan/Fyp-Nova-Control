export const paths = Object.freeze({
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
  rooms: "/dashboard/rooms",
  devices: "/dashboard/devices",
  profile: "/dashboard/profile",
});

export const roomPath = (id) => `${paths.rooms}/${encodeURIComponent(id)}`;

export function isSectionActive(pathname, path) {
  const current = pathname.replace(/\/$/, "");
  return current === path || (path !== paths.dashboard && current.startsWith(path + "/"));
}

export function canonicalPath(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (/^\/rooms?(?:\/|$)/.test(path)) return path.replace(/^\/rooms?/, paths.rooms);
  if (path === "/devices") return paths.devices;
  if (path === "/profile") return paths.profile;
  return path;
}
