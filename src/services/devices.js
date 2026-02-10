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

import { ref, set } from "firebase/database";
import { db, rtdb } from "../lib/firebase";

const devicesCol = (uid) => collection(db, "users", uid, "devices");
const deviceDoc = (uid, id) => doc(db, "users", uid, "devices", id);

// ✅ RTDB path for live state (ESP32 will listen here)
const stateRef = (uid, id) => ref(rtdb, `states/${uid}/${id}`);

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
    await set(stateRef(uid, refDoc.id), {
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

export function onAllDevices(uid, cb) {
  const q = query(devicesCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
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
  // 1) Firestore update (UI/history)
  await updateDoc(deviceDoc(uid, id), { state, updatedAt: serverTimestamp() });

  // 2) RTDB update (ESP32 live)
  await set(stateRef(uid, id), {
    state: !!state,
    updatedAt: Date.now(),
  });
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
