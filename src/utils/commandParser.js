import { setDeviceState } from "../services/devices";
import { resolveCommand } from "./commandMatcher";

export async function parseCommand(text, devices, uid) {
  if (!uid) throw new Error("Please sign in to control your devices.");
  const { targets, state } = resolveCommand(text, devices);
  const results = await Promise.allSettled(targets.map((device) => setDeviceState(uid, device.id, state)));
  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length) {
    const prefix = targets.length > 1 ? `${results.length - failed.length} of ${results.length} commands synced. ` : "";
    throw new Error(prefix + (failed[0].reason?.message || "Unable to sync the command. Please try again."));
  }
  return `Saved the ${state ? "ON" : "OFF"} command for ${targets.length === 1 ? targets[0].name : `${targets.length} devices`}.`;
}
