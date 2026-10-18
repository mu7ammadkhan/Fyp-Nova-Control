import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import postcss from "postcss";
import { createRequestCache } from "../src/utils/requestCache.js";
import { createSharedStore } from "../src/utils/sharedStore.js";
import { syncDeviceCommand, createOptimisticSwitch } from "../src/utils/deviceCommands.js";
import { resolveCommand } from "../src/utils/commandMatcher.js";
import { matchRoutes } from "react-router-dom";
import { routeTree } from "../src/routes/routeTree.js";
import { paths, roomPath, canonicalPath, isSectionActive } from "../src/routes/paths.js";
import { getReturnTo } from "../src/routes/returnTo.js";
import { trimBootstrapCss } from "../build/trimBootstrapCss.js";
import { resolveProfilePhoto } from "../src/utils/profilePhoto.js";

test("profile photo waits for saved data instead of flashing an old provider photo", () => {
  assert.equal(resolveProfilePhoto(null, "old-provider.jpg", false), "");
  assert.equal(resolveProfilePhoto({ photoURL: "current.jpg" }, "old-provider.jpg", true), "current.jpg");
  assert.equal(resolveProfilePhoto(null, "provider.jpg", true), "provider.jpg");
});

test("an explicitly cleared profile photo never restores an older provider photo", () => {
  for (const photoURL of ["", null]) {
    assert.equal(resolveProfilePhoto({ photoURL }, "old-provider.jpg", true), "");
  }
});

test("concurrent requests share work; fresh results are reused until expiry", async () => {
  let time = 0;
  let calls = 0;
  const cache = createRequestCache(15, () => time);
  const load = async () => ++calls;
  const first = cache.get("user", load);
  assert.equal(cache.get("user", load), first);
  assert.equal(await first, 1);
  assert.equal(await cache.get("user", load), 1);
  time = 16;
  assert.equal(await cache.get("user", load), 2);
});

test("cached data is isolated by user and invalidated after mutations", async () => {
  const cache = createRequestCache();
  assert.equal(await cache.get("alice", () => "Alice's room"), "Alice's room");
  assert.equal(await cache.get("bob", () => "Bob's room"), "Bob's room");
  cache.invalidate("alice");
  assert.equal(await cache.get("alice", () => "Renamed room"), "Renamed room");
});

test("failed requests are retried and stale in-flight work cannot replace new data", async () => {
  const cache = createRequestCache();
  await assert.rejects(cache.get("user", () => Promise.reject(new Error("offline"))), /offline/);
  assert.equal(await cache.get("user", () => "online"), "online");
  cache.invalidate("user");
  let finish;
  const stale = cache.get("user", () => new Promise((resolve) => { finish = resolve; }));
  await Promise.resolve();
  cache.invalidate("user");
  assert.equal(await cache.get("user", () => "new room"), "new room");
  finish("old room");
  await stale;
  assert.equal(await cache.get("user", () => "unexpected request"), "new room");
});

test("CSS trimming keeps source classes, runtime controls, resets, dark mode and animations", async () => {
  const directory = mkdtempSync(join(tmpdir(), "nova-css-"));
  try {
    writeFileSync(join(directory, "Page.jsx"), '<div className="btn container col-md-6" />');
    const css = '.unused{color:red}.btn:hover{color:blue}.col-md-6{width:50%}.show{display:block}.modal-backdrop{opacity:.5}.offcanvas.show{display:block}body{margin:0}[data-bs-theme=dark]{color:white}@keyframes spin{to{transform:rotate(360deg)}}.unused-too,.btn{padding:1px}';
    const { css: output } = await postcss([trimBootstrapCss(directory)]).process(css, { from: '/node_modules/bootstrap/dist/css/bootstrap.min.css' });
    assert.ok(!output.includes('.unused{'));
    for (const required of ['.btn:hover', '.col-md-6', '.show', '.modal-backdrop', '.offcanvas.show', 'body', '[data-bs-theme=dark]', '@keyframes spin', '.unused-too,.btn']) assert.ok(output.includes(required), required);
    const custom = await postcss([trimBootstrapCss(directory)]).process('.unlisted-custom{color:red}', { from: '/src/custom.css' });
    assert.equal(custom.css, '.unlisted-custom{color:red}');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("navigation reuses loaded rooms and shares one connection between pages", async () => {
  let connections = 0;
  let disconnects = 0;
  let update;
  const initial = { rooms: [], devices: [], roomsLoaded: false };
  const store = createSharedStore(initial, (publish) => {
    connections++;
    update = publish;
    return () => { disconnects++; };
  });
  const closeNavbar = store.subscribe(() => {});
  update({ rooms: [{ id: "living-room", name: "Living room" }], roomsLoaded: true });
  const loadedRooms = store.getSnapshot().rooms;
  const closeRoomsPage = store.subscribe(() => {});
  assert.equal(connections, 1);
  assert.equal(store.getSnapshot().rooms, loadedRooms);
  closeRoomsPage();
  await Promise.resolve();
  const closeNextPage = store.subscribe(() => {});
  assert.equal(store.getSnapshot().roomsLoaded, true);
  update({ devices: [{ id: "light", state: true }] });
  assert.equal(store.getSnapshot().rooms, loadedRooms);
  assert.equal(connections, 1);
  assert.equal(disconnects, 0);
  closeNextPage(); closeNavbar();
  await Promise.resolve();
  assert.equal(disconnects, 1);
  assert.equal(store.getSnapshot(), initial, "logout clears session data");
});

test("StrictMode resubscribe keeps the connection and separate sessions do not share data", async () => {
  let connections = 0;
  const makeStore = () => createSharedStore({ rooms: [] }, (publish) => {
    connections++;
    publish({ rooms: [connections] });
    return () => {};
  });
  const first = makeStore();
  const unsubscribe = first.subscribe(() => {});
  unsubscribe();
  const resubscribed = first.subscribe(() => {});
  await Promise.resolve();
  assert.equal(connections, 1);
  const second = makeStore();
  const secondUnsubscribe = second.subscribe(() => {});
  assert.deepEqual(first.getSnapshot().rooms, [1]);
  assert.deepEqual(second.getSnapshot().rooms, [2]);
  resubscribed(); secondUnsubscribe();
  await Promise.resolve();
});

test("hardware command starts without waiting for the Firestore acknowledgement", async () => {
  let hardwareSent = false;
  let metadataStarted = false;
  let confirmMetadata;
  const command = syncDeviceCommand(
    () => { hardwareSent = true; },
    () => { metadataStarted = true; return new Promise((resolve) => { confirmMetadata = resolve; }); },
  );
  await Promise.resolve();
  assert.equal(hardwareSent, true);
  assert.equal(metadataStarted, true);
  confirmMetadata();
  await command;
});

test("partial database failures identify what was actually saved", async () => {
  await assert.rejects(syncDeviceCommand(
    () => undefined,
    () => { throw new Error("permission denied"); },
  ), (error) => error.hardwareSaved === true && error.metadataSaved === false);
  await assert.rejects(syncDeviceCommand(
    () => { throw new Error("hardware write denied"); },
    () => undefined,
  ), (error) => error.hardwareSaved === false && error.metadataSaved === true);
});

test("switch feedback is synchronous and an older error cannot undo a newer click", async () => {
  const requests = [];
  const control = createOptimisticSwitch((state) => new Promise((resolve, reject) => {
    requests.push({ state, resolve, reject });
  }));
  const on = control.set(true);
  assert.equal(control.getSnapshot().target, true);
  assert.equal(control.getSnapshot().pending, true);
  const off = control.set(false);
  assert.equal(control.getSnapshot().target, false);
  assert.deepEqual(requests.map((item) => item.state), [true, false]);
  requests[0].reject(new Error("old request failed"));
  await on;
  assert.equal(control.getSnapshot().target, false);
  assert.equal(control.getSnapshot().error, "");
  assert.equal(control.getSnapshot().pending, true);
  requests[1].resolve();
  await off;
  assert.equal(control.getSnapshot().pending, false);
  assert.equal(control.getSnapshot().target, null);
});

test("failed switches restore server state but never undo a successful hardware command", async () => {
  const failed = createOptimisticSwitch(() => syncDeviceCommand(
    () => Promise.reject(new Error("offline")),
    () => Promise.reject(new Error("offline")),
  ));
  await failed.set(true);
  assert.equal(failed.getSnapshot().target, null);
  assert.equal(failed.getSnapshot().retryState, true);
  assert.ok(failed.getSnapshot().error);
  const partial = createOptimisticSwitch(() => syncDeviceCommand(
    () => undefined,
    () => Promise.reject(new Error("denied")),
  ));
  await partial.set(true);
  assert.equal(partial.getSnapshot().target, true);
  assert.equal(partial.getSnapshot().pending, false);
  assert.ok(partial.getSnapshot().error.includes("dashboard sync failed"));
});

const commandDevices = [
  { id: "one", name: "Main light", type: "Light" },
  { id: "two", name: "Bedroom light", type: "Light" },
  { id: "three", name: "London fan", type: "Fan" },
];

test("assistant resolves saved device names and Roman Urdu actions", () => {
  const result = resolveCommand("London fan band", commandDevices);
  assert.equal(result.state, false, "ON embedded inside London is not an ON action");
  assert.deepEqual(result.targets.map((device) => device.id), ["three"]);
  assert.equal(resolveCommand("Main light kholo", commandDevices).state, true);
});

test("all lights targets every light without switching unrelated devices", () => {
  const result = resolveCommand("All lights off", commandDevices);
  assert.equal(result.state, false);
  assert.deepEqual(result.targets.map((device) => device.id), ["one", "two"]);
  assert.equal(resolveCommand("All devices off", commandDevices).targets.length, 3);
});

test("ambiguous and invalid commands do not select arbitrary devices", () => {
  assert.throws(() => resolveCommand("Light on", commandDevices), /More than one/);
  assert.throws(() => resolveCommand("Main light on and off", commandDevices), /one action/);
  assert.throws(() => resolveCommand("Missing device on", commandDevices), /find that device/);
  assert.throws(() => resolveCommand("Fan on", []), /Add a device/);
});

test("nested room URLs match the authenticated workspace and rooms parent", () => {
  const matches = matchRoutes(routeTree, roomPath("living room"));
  assert.deepEqual(matches.map((match) => match.route.id), ["root", "protected", "workspace", "rooms-layout", "room-devices"]);
  assert.equal(matches.at(-1).params.roomId, "living room");
  assert.equal(matchRoutes(routeTree, paths.rooms).at(-1).route.id, "rooms");
  assert.equal(matchRoutes(routeTree, paths.dashboard).at(-1).route.index, true);
});

test("all workspace pages are protected while login and unknown public URLs have separate routes", () => {
  for (const path of [paths.dashboard, paths.rooms, paths.devices, paths.profile, roomPath("one")]) {
    assert.ok(matchRoutes(routeTree, path).some((match) => match.route.id === "protected"), path);
  }
  assert.deepEqual(matchRoutes(routeTree, paths.login).map((match) => match.route.id), ["root", "guest", "login"]);
  assert.equal(matchRoutes(routeTree, "/missing").at(-1).route.id, "not-found");
  assert.equal(matchRoutes(routeTree, "/dashboard/missing").at(-1).route.id, "workspace-not-found");
  assert.equal(matchRoutes(routeTree, "/dashboard/rooms/one/missing").at(-1).route.id, "workspace-not-found");
});

test("old links redirect once to canonical routes, including trailing slashes", () => {
  for (const [old, next] of [["/room",paths.rooms], ["/room/one",roomPath("one")], ["/rooms/one/",roomPath("one")], ["/devices/",paths.devices], ["/profile/",paths.profile]]) {
    assert.ok(matchRoutes(routeTree, old).at(-1).route.id.startsWith("legacy-"));
    assert.equal(canonicalPath(old), next);
    assert.equal(canonicalPath(next), next, "redirect is idempotent");
  }
});

test("sign-in returns to the requested nested page with search and hash preserved", () => {
  assert.equal(getReturnTo({pathname:"/room/living",search:"?view=all",hash:"#controls"}), roomPath("living")+"?view=all#controls");
  assert.equal(getReturnTo(paths.profile), paths.profile);
  for (const invalid of [null, {}, "https://other.example", "//other.example/dashboard", "/\\other.example", "/login", "/missing", "/dashboard/missing", "/dashboard\n", {pathname:42}]) {
    assert.equal(getReturnTo(invalid), paths.dashboard);
  }
  assert.equal(getReturnTo({pathname:paths.profile,search:42,hash:{}}), paths.profile);
});

test("active navigation respects section boundaries and dashboard index", () => {
  assert.equal(isSectionActive(roomPath("one"), paths.rooms), true);
  assert.equal(isSectionActive(roomPath("one"), paths.dashboard), false);
  assert.equal(isSectionActive(paths.dashboard+"/", paths.dashboard), true);
  assert.equal(isSectionActive("/dashboard/rooms-other", paths.rooms), false);
});
