// src/services/devices.js
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  doc,
  onSnapshot,
  getCountFromServer,
} from "firebase/firestore";

import { db } from "../lib/database";
import { app } from "../lib/firebase";
import { syncDeviceCommand } from "../utils/deviceCommands";

const devicesCol = (uid) => collection(db, "users", uid, "devices");
const deviceDoc = (uid, id) => doc(db, "users", uid, "devices", id);

// ✅ RTDB path for live state (ESP32 will listen here)
// Load the hardware SDK only when a device is created or switched.
let realtimeSdk;
function loadRealtimeSdk() {
  if (!realtimeSdk) realtimeSdk = import("firebase/database").catch((error) => {
    realtimeSdk = undefined;
    throw error;
  });
  return realtimeSdk;
}

export async function warmDeviceConnection() {
  const { getDatabase, ref, onValue } = await loadRealtimeSdk();
  // Establish the Firebase connection before the first power-button click.
  return onValue(ref(getDatabase(app), ".info/connected"), () => {});
}

async function writeDeviceState(uid, id, value) {
  const { getDatabase, ref, set } = await loadRealtimeSdk();
  return set(ref(getDatabase(app), `states/${uid}/${id}`), value);
}

function makeCode(len = 6, prefix = "DV-") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return prefix + out;
}

/** CREATE */
export async function addDevice(uid, { name, type = "Light", roomId, roomName = "", pin = null }) {
  const clean = String(name || "").trim();
  if (!clean) throw new Error("empty_name");
  const now = serverTimestamp();
  const deviceId = makeCode();

  const refDoc = await addDoc(devicesCol(uid), {
    name: clean,
    type,
    deviceId,
    roomId,
    roomName,
    pin: typeof pin === "number" ? pin : null,
    state: false,
    createdAt: now,
    updatedAt: now,
  });

  // Optional: create initial RTDB node (not required, but useful)
  try {
    await writeDeviceState(uid, refDoc.id, {
      state: false,
      updatedAt: Date.now(),
    });
  } catch {
    // ignore if rules/config not ready
  }

  return {
    id: refDoc.id,
    name: clean,
    type,
    deviceId,
    roomId,
    roomName,
    pin,
    state: false,
  };
}

/** LIST (once) */
export async function getDevicesByRoom(uid, roomId) {
  const q = query(devicesCol(uid), where("roomId", "==", roomId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllDevices(uid) {
  const q = query(devicesCol(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** REALTIME */
export function onDevicesByRoom(uid, roomId, cb) {
  const q = query(devicesCol(uid), where("roomId", "==", roomId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function onAllDevices(uid, cb, onError) {
  const q = query(devicesCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

/** COUNTS */
export async function countDevices(uid) {
  const q = query(devicesCol(uid));
  const agg = await getCountFromServer(q);
  return agg.data().count || 0;
}

export async function countDevicesInRoom(uid, roomId) {
  const q = query(devicesCol(uid), where("roomId", "==", roomId));
  const agg = await getCountFromServer(q);
  return agg.data().count || 0;
}

/** MUTATIONS */
export async function setDeviceState(uid, id, state) {
  const next = !!state;
  return syncDeviceCommand(
    () => writeDeviceState(uid, id, { state: next, updatedAt: Date.now() }),
    () => updateDoc(deviceDoc(uid, id), { state: next, updatedAt: serverTimestamp() }),
  );
}

export async function renameDevice(uid, id, name) {
  const clean = String(name || "").trim();
  if (!clean) throw new Error("empty_name");
  await updateDoc(deviceDoc(uid, id), { name: clean, updatedAt: serverTimestamp() });
}

export async function removeDevice(uid, id) {
  await deleteDoc(deviceDoc(uid, id));
  // Optional: also delete from RTDB (not required for demo)
  // await set(stateRef(uid, id), null);
}
