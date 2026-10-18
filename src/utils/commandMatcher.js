const normalize = (text) => String(text || "").trim().toLowerCase().replace(/\s+/g, " ");

export function resolveCommand(text, devices) {
  const command = normalize(text);
  const on = /\b(on|khol|kholo)\b/.test(command);
  const off = /\b(off|band)\b/.test(command);
  if (on === off) throw new Error("Use one action: ON or OFF. For example, 'Main light on'.");
  if (!devices.length) throw new Error("Add a device to one of your rooms first.");
  const all = /\b(all|sab|saare)\b/.test(command);
  const types = devices.filter((device) => {
    const type = normalize(device.type).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return type && new RegExp(`\\b${type}s?\\b`).test(command);
  });
  let targets;
  if (all) {
    targets = /\b(devices?|appliances?)\b/.test(command) ? devices : types;
  } else {
    const named = devices.filter((device) => normalize(device.name) && command.includes(normalize(device.name)));
    const longest = Math.max(0, ...named.map((device) => normalize(device.name).length));
    targets = named.length ? named.filter((device) => normalize(device.name).length === longest) : types;
    if (targets.length > 1) throw new Error("More than one device matches. Use its full name, or say 'all lights off'.");
  }
  if (!targets.length) throw new Error("I couldn’t find that device. Try its name as shown on your device card.");
  return { targets, state: on };
}
