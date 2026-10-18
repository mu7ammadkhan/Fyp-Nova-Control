import { matchRoutes } from "react-router-dom";
import { canonicalPath, paths } from "./paths.js";
import { routeTree } from "./routeTree.js";

const destinations = new Set(["dashboard", "rooms", "room-devices", "devices", "profile"]);

export function getReturnTo(from) {
  const value = typeof from === "string" ? from : typeof from?.pathname === "string"
    ? from.pathname + (typeof from.search === "string" && from.search.startsWith("?") ? from.search : "") + (typeof from.hash === "string" && from.hash.startsWith("#") ? from.hash : "")
    : "";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || Array.from(value).some((character) => character.charCodeAt(0) < 32)) return paths.dashboard;
  try {
    const url = new URL(value, "https://nova.local");
    if (url.origin !== "https://nova.local") return paths.dashboard;
    const pathname = canonicalPath(url.pathname);
    const matches = matchRoutes(routeTree, pathname);
    if (!destinations.has(matches?.at(-1)?.route.id)) return paths.dashboard;
    return pathname + url.search + url.hash;
  } catch {
    return paths.dashboard;
  }
}
