import { useEffect } from "react";
import { warmDeviceConnection } from "../services/devices";

export function useDeviceConnection() {
  useEffect(() => {
    let disposed = false;
    let unsubscribe;
    warmDeviceConnection().then((stop) => {
      if (disposed) stop();
      else unsubscribe = stop;
    }).catch(() => { /* A click retries SDK loading and reports write errors. */ });
    return () => { disposed = true; unsubscribe?.(); };
  }, []);
}
