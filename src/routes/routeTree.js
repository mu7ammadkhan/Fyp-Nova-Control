// The runtime router and route-matching tests use this same hierarchy.
export const routeTree = [{
  id: "root", path: "/", children: [
    { id: "home", index: true },
    { id: "guest", children: [{ id: "login", path: "login", handle: { title: "Sign in" } }] },
    { id: "protected", children: [
      { id: "workspace", path: "dashboard", children: [
        { id: "dashboard", index: true, handle: { title: "Dashboard" } },
        { id: "rooms-layout", path: "rooms", children: [
          { id: "rooms", index: true, handle: { title: "Rooms" } },
          { id: "room-devices", path: ":roomId", handle: { title: "Room devices" } },
        ] },
        { id: "devices", path: "devices", handle: { title: "Devices" } },
        { id: "profile", path: "profile", handle: { title: "Profile" } },
        { id: "workspace-not-found", path: "*", handle: { title: "Page not found" } },
      ] },
      ...["room", "room/:roomId", "rooms", "rooms/:roomId", "devices", "profile"].map((path) => ({ id: `legacy-${path}`, path })),
    ] },
    { id: "not-found", path: "*", handle: { title: "Page not found" } },
  ],
}];
