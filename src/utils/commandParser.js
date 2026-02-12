import { setDeviceState } from "../services/devices";

export function parseCommand(text, devices, uid) {
  const cmd = text.toLowerCase();

  // Detect action
  let action = null;
  if (cmd.includes("on") || cmd.includes("khol") || cmd.includes("kholo")) {
    action = true;
  }
  if (cmd.includes("off") || cmd.includes("band")) {
    action = false;
  }

  if (action === null) {
    alert("Could not understand ON / OFF");
    return;
  }

  // 🔥 1️⃣ Specific device name match first
  const exactMatch = devices.find((d) =>
    cmd.includes(d.name.toLowerCase())
  );

  if (exactMatch) {
    setDeviceState(uid, exactMatch.id, action);
    return;
  }

  // 🔥 2️⃣ Type match (Light, Fan, etc.)
  const typeMatches = devices.filter((d) =>
    cmd.includes(d.type.toLowerCase())
  );

  if (typeMatches.length === 1) {
    setDeviceState(uid, typeMatches[0].id, action);
    return;
  }

  if (typeMatches.length > 1) {
    // If user said "all lights"
    if (cmd.includes("all")) {
      typeMatches.forEach((d) =>
        setDeviceState(uid, d.id, action)
      );
      return;
    }

    alert("Multiple devices found. Please specify name.");
    return;
  }

  alert("Device not found");
}
