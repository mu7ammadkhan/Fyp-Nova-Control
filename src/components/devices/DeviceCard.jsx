import { useMemo, useState, useSyncExternalStore } from "react";
import { FiWind, FiZap, FiPower, FiThermometer, FiEdit2, FiTrash2, FiX, FiCheck, FiMapPin, FiRefreshCw } from "react-icons/fi";
import { renameDevice, removeDevice, setDeviceState } from "../../services/devices";
import { createOptimisticSwitch } from "../../utils/deviceCommands";

export default function DeviceCard({ device, uid, roomName }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(device.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const power = useMemo(() => createOptimisticSwitch((state) => setDeviceState(uid, device.id, state)), [uid, device.id]);
  const command = useSyncExternalStore(power.subscribe, power.getSnapshot, power.getSnapshot);
  const isOn = command.target ?? !!device.state;
  const type = (device.type || "").toLowerCase();
  const TypeIcon = type === "fan" ? FiWind : type === "light" ? FiZap : ["ac", "fridge"].includes(type) ? FiThermometer : FiPower;
  const run = async (operation) => {
    setPending(true); setError("");
    try { await operation(); }
    catch { setError("This change could not be completed. Please try again."); }
    finally { setPending(false); }
  };
  const save = (event) => { event.preventDefault(); run(async () => { await renameDevice(uid, device.id, name); setEditing(false); }); };
  return (
    <article className={`power-card ${isOn ? "power-card-on" : ""}`}>
      <header className="power-card-header"><span className="power-device-kind"><TypeIcon />{device.type || "Device"}</span><div className="manage-actions"><button className="manage-icon-button" onClick={() => { setName(device.name); setEditing(true); }} disabled={pending || command.pending} aria-label={`Rename ${device.name}`}><FiEdit2 /></button><button className="manage-icon-button danger" disabled={pending || command.pending} aria-label={`Delete ${device.name}`} onClick={() => { if (window.confirm(`Delete ${device.name}?`)) run(() => removeDevice(uid, device.id)); }}><FiTrash2 /></button></div></header>
      <div className="power-card-body"><div className="power-device-info">
        {editing ? <form className="control-rename" onSubmit={save}><input className="manage-input" aria-label="Device name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} autoFocus disabled={pending} /><button className="manage-icon-button" disabled={pending} aria-label="Save device name"><FiCheck /></button><button className="manage-icon-button" type="button" onClick={() => setEditing(false)} disabled={pending} aria-label="Cancel rename"><FiX /></button></form> : <h2>{device.name}</h2>}
        <p className="power-room"><FiMapPin />{roomName || device.roomName || "Unassigned room"}</p>
        <p className="power-device-id">{device.deviceId || "Home device"}</p>
      </div><button className="power-button" type="button" role="switch" aria-checked={isOn} aria-label={`Power for ${device.name}`} title={`Turn ${device.name} ${isOn ? "off" : "on"}`} disabled={pending || editing} onClick={() => { setError(""); power.set(!isOn); }}><FiPower /><span>{isOn ? "ON" : "OFF"}</span></button></div>
      {(error || command.error) && <div className="power-error" role="alert"><p>{error || command.error}</p>{command.retryState !== null && <button className="power-retry" onClick={() => power.set(command.retryState)} disabled={command.pending || pending}><FiRefreshCw /> Retry sync</button>}</div>}
      <footer className="power-card-footer"><span className="power-state-label"><i aria-hidden="true" />{isOn ? "Switched on" : "Switched off"}</span><span className="power-sync-note" role="status">{command.pending ? "Syncing command..." : command.error ? "Sync needs attention" : "Tap power to switch"}</span></footer>
    </article>
  );
}
