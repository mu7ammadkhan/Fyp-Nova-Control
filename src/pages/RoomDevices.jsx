import { paths } from "../routes/paths";
import "../manage.css";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiHome, FiPower } from "react-icons/fi";
import { useAuthContext } from "../hooks/useAuth";
import { useHomeData } from "../hooks/useHomeData";
import { useDeviceConnection } from "../hooks/useDeviceConnection";
import { addDevice } from "../services/devices";
import DeviceCard from "../components/devices/DeviceCard";

export default function RoomDevices() {
  useDeviceConnection();
  const { user } = useAuthContext();
  const { roomId } = useParams();
  const { rooms, devices: allDevices, roomsLoaded, devicesLoaded, roomsError, devicesError } = useHomeData(user.uid);
  const room = rooms.find((item) => item.id === roomId);
  const devices = allDevices.filter((device) => device.roomId === roomId);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("Light");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await addDevice(user.uid, {name,type,roomId,roomName:room.name,pin:type === "Light" ? 2 : null}); setName(""); setShowAdd(false); }
    catch { setError("Unable to add this device. Please try again."); }
    finally { setSaving(false); }
  };
  if (roomsLoaded && !room && !roomsError) return <main className="container manage-page"><div className="manage-empty"><FiHome /><h1>Room not found</h1><p>This room may have been removed.</p><Link className="workspace-button" to={paths.rooms}>Back to rooms</Link></div></main>;
  return <main className="container manage-page devices-manage-page">
    <Link className="manage-back" to={paths.rooms}><FiArrowLeft /> All rooms</Link>
    <header className="manage-heading"><div><span className="workspace-eyebrow">YOUR CONNECTED SPACE</span><h1>{room?.name || "Your room"}</h1><p>Every device in this space, right here.</p></div><button className="workspace-button" disabled={!room} onClick={() => setShowAdd((value) => !value)}><FiPlus /> Add device</button></header>
    {(error || roomsError || devicesError) && <div className="manage-notice" role="alert">{error || roomsError || devicesError}</div>}
    <section className="manage-banner"><span className="manage-banner-icon"><FiPower /></span><div><h2>{devicesLoaded ? `${devices.length} devices in this room` : "Your room controls"}</h2><p>{devicesLoaded ? `${devices.filter((device) => device.state).length} switched on` : "Syncing your saved switches..."}</p></div><span className="space-code">{room?.code}</span></section>
    {showAdd && <form className="manage-editor room-device-form" onSubmit={save}><div><label htmlFor="device-name">Device name</label><input id="device-name" className="manage-input" placeholder="e.g. Main light" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} disabled={saving} autoFocus /></div><div><label htmlFor="device-type">Type</label><select id="device-type" className="manage-input" value={type} onChange={(event) => setType(event.target.value)} disabled={saving}>{["Light","Fan","AC","Fridge","Other"].map((option) => <option key={option}>{option}</option>)}</select></div><button className="workspace-button" disabled={saving}>{saving ? "Adding..." : "Add device"}</button><button className="manage-secondary" type="button" disabled={saving} onClick={() => setShowAdd(false)}>Cancel</button></form>}
    <div className="manage-toolbar"><h2>Room devices</h2></div>
    {!devicesLoaded ? <div className="manage-grid" role="status" aria-label="Loading room devices">{[1,2,3].map((id) => <div key={id} className="manage-skeleton"><span /><span /><span /></div>)}</div> : devices.length ? <div className="manage-grid device-control-grid">{devices.map((device) => <DeviceCard key={device.id} device={device} uid={user.uid} roomName={room?.name} />)}</div> : !devicesError && <div className="manage-empty"><FiPower /><h2>A little control starts here</h2><p>Add your first device to this room.</p><button className="workspace-button" onClick={() => setShowAdd(true)} disabled={!room}><FiPlus /> Add device</button></div>}
    <p className="manage-footnote">ON and OFF reflect saved switch commands.</p>
  </main>;
}
