import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/database";
import { createRequestCache } from "../utils/requestCache";

const roomRequests = createRequestCache();

const roomsCol = (uid) => collection(db, "users", uid, "rooms");
const roomDoc  = (uid, id) => doc(db, "users", uid, "rooms", id);

/* Generate short ESP32-friendly code like RM-8X2FQ1 */
function makeCode(len = 6, prefix = "RM-") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return prefix + out;
}

/* Ensure unique code per user */
async function uniqueCode(uid) {
  for (let i = 0; i < 5; i++) {
    const code = makeCode();
    const snap = await getDocs(query(roomsCol(uid), where("code", "==", code)));
    if (snap.empty) return code;
  }
  return makeCode(8, "RM-");
}

/* ---- DUPLICATE CHECK (handles old docs without nameLower) ---- */
async function nameExists(uid, name, exceptId = null) {
  const lower = name.toLowerCase();

  // 1) Newer docs with nameLower
  const q1 = query(roomsCol(uid), where("nameLower", "==", lower));
  const s1 = await getDocs(q1);
  const hit1 = s1.docs.some(d => d.id !== exceptId);
  if (hit1) return true;

  // 2) Legacy docs that only have "name"
  const q2 = query(roomsCol(uid), where("name", "==", name));
  const s2 = await getDocs(q2);
  const hit2 = s2.docs.some(d => d.id !== exceptId);

  return hit2;
}

/* CREATE */
export async function addRoom(uid, name) {
  const clean = name.trim();
  if (!clean) throw new Error("empty_name");
  if (await nameExists(uid, clean)) {
    const err = new Error("name_exists"); err.code = "name_exists"; throw err;
  }
  const code = await uniqueCode(uid);
  const now = serverTimestamp();
  const ref = await addDoc(roomsCol(uid), {
    name: clean,
    nameLower: clean.toLowerCase(),   // store normalized for fast checks next time
    code,
    createdAt: now,
    updatedAt: now,
  });
  roomRequests.invalidate(uid);
  return { id: ref.id, name: clean, code, createdAt: new Date(), updatedAt: new Date() };
}

/* LIST */
export async function getRooms(uid) {
  return roomRequests.get(uid, async () => {
    const snap = await getDocs(query(roomsCol(uid), orderBy("createdAt", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  });
}

export async function getRoom(uid, id) {
  const snap = await getDoc(roomDoc(uid, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* RENAME */
export async function renameRoom(uid, id, newName) {
  const clean = newName.trim();
  if (!clean) throw new Error("empty_name");
  if (await nameExists(uid, clean, id)) {
    const err = new Error("name_exists"); err.code = "name_exists"; throw err;
  }
  await updateDoc(roomDoc(uid, id), {
    name: clean,
    nameLower: clean.toLowerCase(),
    updatedAt: serverTimestamp(),
  });
  roomRequests.invalidate(uid);
}

/* DELETE */
export async function removeRoom(uid, id) {
  await deleteDoc(roomDoc(uid, id));
  roomRequests.invalidate(uid);
}

/* (Optional) One-time helper to backfill nameLower on legacy docs */
export async function normalizeRoomNames(uid) {
  const snap = await getDocs(roomsCol(uid));
  const updates = snap.docs
    .filter(d => !d.data().nameLower && d.data().name)
    .map(d => updateDoc(roomDoc(uid, d.id), { nameLower: String(d.data().name).toLowerCase() }));
  await Promise.allSettled(updates);
}
