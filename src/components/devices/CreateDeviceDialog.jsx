import { useState } from "react";
import { Link } from "react-router-dom";
import { FiHome, FiPlus, FiPower, FiArrowRight } from "react-icons/fi";
import PopupDialog from "../common/PopupDialog";
import { addDevice } from "../../services/devices";
import { paths } from "../../routes/paths";

export default function CreateDeviceDialog({ uid, rooms, fixedRoomId, onClose }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Light");
  const [roomId, setRoomId] = useState(fixedRoomId || rooms[0]?.id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const room = rooms.find((item) => item.id === roomId);
  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!name.trim() || !room) { setError("Enter a device name and choose an available room."); return; }
    setSaving(true); setError("");
    try {
      await addDevice(uid, { name: name.trim(), type, roomId, roomName: room.name, pin: type === "Light" ? 2 : null });
      onClose();
    } catch { setError("Unable to add this device. Please try again."); }
    finally { setSaving(false); }
  };
  return <PopupDialog title="Add a device" description="Give your device a name and a place in your home." icon={<FiPower />} busy={saving} onClose={onClose}>
    {rooms.length ? <form className="popup-form" onSubmit={save} aria-busy={saving}>
      {fixedRoomId ? <div className="popup-room"><FiHome /><span>{room?.name || "Room no longer available"}</span></div> : <label className="popup-field" htmlFor="new-device-room">Room<select id="new-device-room" className="manage-input" value={roomId} onChange={(event) => setRoomId(event.target.value)} disabled={saving} required>{!room && <option value="">Choose a room</option>}{rooms.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}
      <label className="popup-field" htmlFor="new-device-name">Device name<input id="new-device-name" className="manage-input" placeholder="e.g. Main light" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required disabled={saving} autoFocus /></label>
      <label className="popup-field" htmlFor="new-device-type">Device type<select id="new-device-type" className="manage-input" value={type} onChange={(event) => setType(event.target.value)} disabled={saving}>{["Light", "Fan", "AC", "Fridge", "Other"].map((option) => <option key={option}>{option}</option>)}</select><small>Your device starts switched off. You can control it after adding.</small></label>
      {error && <div className="manage-notice" role="alert">{error}</div>}
      <footer className="popup-actions"><button type="button" className="manage-secondary" disabled={saving} onClick={onClose}>Cancel</button><button className="workspace-button" disabled={saving || !room || !name.trim()}><FiPlus />{saving ? "Adding device..." : "Add device"}</button></footer>
    </form> : <div className="popup-empty"><p>Create a room first, then give your new device a home.</p><footer className="popup-actions"><button className="manage-secondary" onClick={onClose}>Cancel</button><Link className="workspace-button" to={paths.rooms} onClick={onClose}>Go to rooms <FiArrowRight /></Link></footer></div>}
  </PopupDialog>;
}
