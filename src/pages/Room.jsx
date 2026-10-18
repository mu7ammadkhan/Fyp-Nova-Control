import { roomPath } from "../routes/paths";
import "../manage.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiHome, FiPlus, FiSearch, FiEdit2, FiTrash2, FiArrowUpRight, FiX, FiGrid } from "react-icons/fi";
import { useAuthContext } from "../hooks/useAuth";
import { useHomeData } from "../hooks/useHomeData";
import { addRoom, renameRoom, removeRoom } from "../services/rooms";

export default function RoomsPage() {
  const { user } = useAuthContext();
  const { rooms, devices, roomsLoaded, devicesLoaded, roomsError, devicesError } = useHomeData(user.uid);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const visible = rooms.filter((room) => room.name.toLowerCase().includes(search.toLowerCase()));
  const counts = new Map();
  devices.forEach((device) => {
    const count = counts.get(device.roomId) || { total: 0, active: 0 };
    count.total++; if (device.state) count.active++;
    counts.set(device.roomId, count);
  });
  const edit = (room = {}) => { setEditor(room.id || "new"); setName(room.name || ""); setError(""); };
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      if (editor === "new") await addRoom(user.uid, name);
      else await renameRoom(user.uid, editor, name);
      setEditor(null); setName("");
    } catch (err) { setError(err.code === "name_exists" ? "A room with this name already exists." : "Unable to save the room. Please try again."); }
    finally { setSaving(false); }
  };
  const remove = async (room) => {
    if (!window.confirm(`Delete ${room.name}? Its devices will remain in All Devices.`)) return;
    setError("");
    try { await removeRoom(user.uid, room.id); }
    catch { setError("Unable to delete this room. Please try again."); }
  };
  return (
    <main className="container manage-page">
      <header className="manage-heading"><div><span className="workspace-eyebrow">YOUR SPACES</span><h1>Rooms</h1><p>A place for every part of your home.</p></div><button className="workspace-button" onClick={() => edit()}><FiPlus /> Add room</button></header>
      <section className="manage-banner"><span className="manage-banner-icon"><FiGrid /></span><div><h2>Every room, connected.</h2><p>Organize your devices by the spaces you live in.</p></div><span className="manage-total">{roomsLoaded ? rooms.length : "—"}<small>total rooms</small></span></section>
      {(roomsError || error || devicesError) && <div className="manage-notice" role="alert">{error || roomsError || devicesError}</div>}
      {editor && <form className="manage-editor" onSubmit={save}><div><label htmlFor="room-name">{editor === "new" ? "Create a room" : "Rename room"}</label><input id="room-name" className="manage-input" placeholder="e.g. Living room" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} disabled={saving} autoFocus /></div><button className="workspace-button" disabled={saving}>{saving ? "Saving..." : "Save room"}</button><button className="manage-icon-button" type="button" onClick={() => setEditor(null)} disabled={saving} aria-label="Cancel room edit"><FiX /></button></form>}
      <div className="manage-toolbar"><h2>Your rooms <span>{roomsLoaded ? visible.length : "—"}</span></h2><label className="manage-search"><FiSearch /><input aria-label="Search rooms" placeholder="Search rooms..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
      {!roomsLoaded ? <div className="manage-grid" role="status" aria-label="Loading rooms">{[1,2,3].map((id) => <div className="manage-skeleton" key={id}><span /><span /><span /></div>)}</div> : visible.length ? <div className="manage-grid">{visible.map((room, index) => {
        const count = counts.get(room.id) || { total: 0, active: 0 };
        return <article className="space-card" key={room.id}><div className="space-card-top"><span className={`space-icon tone-${index % 3}`}><FiHome /></span><div className="manage-actions"><button className="manage-icon-button" onClick={() => edit(room)} aria-label={`Rename ${room.name}`} title="Rename room"><FiEdit2 /></button><button className="manage-icon-button danger" onClick={() => remove(room)} aria-label={`Delete ${room.name}`} title="Delete room"><FiTrash2 /></button></div></div><Link className="space-name" to={roomPath(room.id)}>{room.name}</Link><p className="space-code">{room.code || "Your connected space"}</p><div className="space-metrics"><span>{devicesLoaded && !devicesError ? `${count.total} devices` : "Devices syncing..."}</span>{devicesLoaded && !devicesError && <span className={count.active ? "state-text-on" : ""}>{count.active} switched on</span>}</div><Link className="space-open" to={roomPath(room.id)}>Open room <FiArrowUpRight /></Link></article>;
      })}</div> : !roomsError && <div className="manage-empty"><FiHome /><h2>{search ? "No matching rooms" : "Make space for smarter living"}</h2><p>{search ? "Try a different room name." : "Create your first room and start adding devices."}</p>{!search && <button className="workspace-button" onClick={() => edit()}><FiPlus /> Add your first room</button>}</div>}
    </main>
  );
}
