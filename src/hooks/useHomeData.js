import { useSyncExternalStore } from "react";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/database";
import { createSharedStore } from "../utils/sharedStore";

const stores = new Map();
const initial = {
  rooms: [], devices: [], profile: null,
  roomsLoaded: false, devicesLoaded: false, profileLoaded: false,
  roomsError: "", devicesError: "", profileError: "",
};

function getStore(uid) {
  if (!stores.has(uid)) {
    stores.set(uid, createSharedStore(initial, (update) => {
      if (!uid) return () => {};
      const subscriptions = ["rooms", "devices"].map((key) => onSnapshot(
        query(collection(db, "users", uid, key), orderBy("createdAt", "desc")),
        (snapshot) => update({
          [key]: snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
          [`${key}Loaded`]: true, [`${key}Error`]: "",
        }),
        () => update({ [`${key}Loaded`]: true, [`${key}Error`]: `Unable to load ${key}. Please refresh to reconnect.` }),
      ));
      subscriptions.push(onSnapshot(doc(db, "users", uid), (snapshot) => {
        update({ profile: snapshot.exists() ? snapshot.data() : null, profileLoaded: true, profileError: "" });
      }, () => update({ profileLoaded: true, profileError: "Unable to load your saved profile. Please refresh to reconnect." })));
      return () => subscriptions.forEach((unsubscribe) => unsubscribe());
    }));
  }
  return stores.get(uid);
}

export function useHomeData(uid) {
  const store = getStore(uid);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
