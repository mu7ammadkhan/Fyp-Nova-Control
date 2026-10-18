import CreateDeviceDialog from "../components/devices/CreateDeviceDialog";
import { paths } from "../routes/paths";
import "../manage.css";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiHome, FiPower } from "react-icons/fi";
import { useAuthContext } from "../hooks/useAuth";
import { useHomeData } from "../hooks/useHomeData";
import { useDeviceConnection } from "../hooks/useDeviceConnection";
import DeviceCard from "../components/devices/DeviceCard";

export default function RoomDevices() {
  useDeviceConnection();
  const { user } = useAuthContext();
  const { roomId } = useParams();
  const { rooms, devices: allDevices, roomsLoaded, devicesLoaded, roomsError, devicesError } = useHomeData(user.uid);
  const room = rooms.find((item) => item.id === roomId);
  const devices = allDevices.filter((device) => device.roomId === roomId);
  const [showAdd, setShowAdd] = useState(false);
  if (roomsLoaded && !room && !roomsError) return <main className="container manage-page"><div className="manage-empty"><FiHome /><h1>Room not found</h1><p>This room may have been removed.</p><Link className="workspace-button" to={paths.rooms}>Back to rooms</Link></div></main>;
  return <main className="container manage-page devices-manage-page">
    <Link className="manage-back" to={paths.rooms}><FiArrowLeft /> All rooms</Link>
    <header className="manage-heading"><div><span className="workspace-eyebrow">YOUR CONNECTED SPACE</span><h1>{room?.name || "Your room"}</h1><p>Every device in this space, right here.</p></div><button className="workspace-button" disabled={!room} onClick={() => setShowAdd((value) => !value)}><FiPlus /> Add device</button></header>
    {(roomsError || devicesError) && <div className="manage-notice" role="alert">{roomsError || devicesError}</div>}
    <section className="manage-banner"><span className="manage-banner-icon"><FiPower /></span><div><h2>{devicesLoaded ? `${devices.length} devices in this room` : "Your room controls"}</h2><p>{devicesLoaded ? `${devices.filter((device) => device.state).length} switched on` : "Syncing your saved switches..."}</p></div><span className="space-code">{room?.code}</span></section>
    {showAdd && <CreateDeviceDialog uid={user.uid} rooms={rooms} fixedRoomId={roomId} onClose={() => setShowAdd(false)} />}
    <div className="manage-toolbar"><h2>Room devices</h2></div>
    {!devicesLoaded ? <div className="manage-grid" role="status" aria-label="Loading room devices">{[1,2,3].map((id) => <div key={id} className="manage-skeleton"><span /><span /><span /></div>)}</div> : devices.length ? <div className="manage-grid device-control-grid">{devices.map((device) => <DeviceCard key={device.id} device={device} uid={user.uid} roomName={room?.name} />)}</div> : !devicesError && <div className="manage-empty"><FiPower /><h2>A little control starts here</h2><p>Add your first device to this room.</p><button className="workspace-button" onClick={() => setShowAdd(true)} disabled={!room}><FiPlus /> Add device</button></div>}
    <p className="manage-footnote">ON and OFF reflect saved switch commands.</p>
  </main>;
}
