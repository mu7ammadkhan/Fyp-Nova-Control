import { setDeviceState } from "../services/devices";

/**
 * text   → user command
 * devices → list from Devices.jsx
 * uid    → logged-in user id
 */
export function parseCommand(text, devices, uid) {
  const cmd = text.toLowerCase();

  // ON / OFF detect
  let action = null;
  if (cmd.includes("on")) action = true;
  if (cmd.includes("khol")) action = true;
  if (cmd.includes("kholo")) action = true;
  if (cmd.includes("off")) action = false;
  if (cmd.includes("band")) action = false;

  if (action === null) {
    alert("Could not understand ON / OFF");
    return;
  }

  // Device match (by name OR type)
  const device = devices.find((d) =>
    cmd.includes(d.name.toLowerCase()) ||
    cmd.includes(d.type.toLowerCase())
  );

  if (!device) {
    alert("Device not found");
    return;
  }

  // 🔥 Update Firebase via existing service
  setDeviceState(uid, device.id, action);
}
