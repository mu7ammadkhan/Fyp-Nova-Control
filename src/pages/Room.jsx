import PopupDialog from "../components/common/PopupDialog";
import { roomPath } from "../routes/paths";
import "../manage.css";
import "../rooms.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiHome, FiPlus, FiSearch, FiEdit2, FiTrash2, FiArrowUpRight, FiX, FiGrid, FiArrowRight, FiPower } from "react-icons/fi";
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
  const visible = rooms.filter((room) => room.name.toLowerCase().includes(search.trim().toLowerCase()));
  const counts = new Map();
  devices.forEach((device) => {
    const count = counts.get(device.roomId) || { total: 0, active: 0 };
    count.total++; if (device.state) count.active++;
    counts.set(device.roomId, count);
  });
  const edit = (room = {}) => { setEditor(room.id || "new"); setName(room.name || ""); setError(""); };
  const save = async (event) => {
    event.preventDefault(); if (saving || !name.trim()) return; setSaving(true); setError("");
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
    <main className="container dashboard-page rooms-dashboard-page">
      <header className="dashboard-heading"><div><span className="workspace-eyebrow">YOUR HOME, ROOM BY ROOM</span><h1>Rooms</h1><p>Your favorite spaces, thoughtfully connected.</p></div><button className="workspace-button" onClick={() => edit()} disabled={saving}><FiPlus /> Add room</button></header>
      <section className="dashboard-welcome rooms-welcome"><div><span className="dashboard-welcome-label"><FiGrid /> YOUR CONNECTED SPACES</span><h2>Every room feels like home.</h2><p>A place for every device. A little more comfort<br />in every corner of your home.</p><button className="rooms-hero-action" onClick={() => edit()} disabled={saving}>Create a new space <FiArrowRight /></button></div><div className="rooms-hero-art" aria-hidden="true"><span className="rooms-hero-orbit" /><span className="rooms-hero-orbit orbit-outer" /><div className="rooms-hero-house"><FiHome /></div><span className="rooms-hero-chip"><FiGrid />{roomsLoaded ? rooms.length + (rooms.length === 1 ? " room" : " rooms") : "Your home spaces"}</span></div></section>
      {(roomsError || (!editor && error) || devicesError) && <div className="manage-notice" role="alert">{(!editor && error) || roomsError || devicesError}</div>}
      <section className="rooms-collection-panel" aria-labelledby="your-rooms-title"><header className="rooms-section-heading"><div><h2 id="your-rooms-title">Your rooms</h2><p>Choose a space to manage the devices inside.</p></div><span className="rooms-result-count">{roomsLoaded ? visible.length + (visible.length === 1 ? " room" : " rooms") : "Syncing rooms"}</span></header>
        <div className="rooms-search-bar"><span><FiGrid />All spaces</span><label className="manage-search"><FiSearch /><input aria-label="Search rooms" placeholder="Search your rooms..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
        {search && <div className="rooms-search-summary"><span>Showing matching rooms</span><button onClick={() => setSearch("")}><FiX />Clear search</button></div>}
        {!roomsLoaded ? <div className="manage-grid rooms-card-grid" role="status" aria-label="Loading rooms">{[1,2,3].map((id) => <div className="manage-skeleton" key={id}><span /><span /><span /></div>)}</div> : visible.length ? <div className="manage-grid rooms-card-grid">{visible.map((room, index) => {
          const count = counts.get(room.id) || { total:0, active:0 };
          const counted = devicesLoaded && !devicesError;
          return <article className="room-space-card" key={room.id}><header><span className={"room-space-icon room-tone-" + index % 3}><FiHome /></span><div className="manage-actions"><button className="manage-icon-button" onClick={() => edit(room)} disabled={saving} aria-label={"Rename " + room.name} title="Rename room"><FiEdit2 /></button><button className="manage-icon-button danger" onClick={() => remove(room)} disabled={saving} aria-label={"Delete " + room.name} title="Delete room"><FiTrash2 /></button></div></header><Link className="room-space-name" to={roomPath(room.id)}>{room.name}</Link><p className="room-space-code">{room.code || "Your connected space"}</p><div className="room-space-devices"><FiGrid /><span>{counted ? count.total + (count.total === 1 ? " device" : " devices") : "Devices syncing..."}</span></div><footer><span className={"room-power-status " + (counted && count.active ? "has-power" : "")}><i aria-hidden="true" />{counted ? count.active ? count.active + " switched on" : count.total ? "All switched off" : "Ready for devices" : "Syncing controls"}</span><Link to={roomPath(room.id)} aria-label={"Open " + room.name}><FiArrowUpRight /></Link></footer></article>;
        })}</div> : !roomsError && <div className="manage-empty"><FiHome /><h2>{search ? "No matching rooms" : "Make space for smarter living"}</h2><p>{search ? "Try another name to find your room." : "Create your first room, then add the devices that make it yours."}</p>{search ? <button className="workspace-button" onClick={() => setSearch("")}>Clear search</button> : <button className="workspace-button" onClick={() => edit()}><FiPlus /> Add your first room</button>}</div>}
        <footer className="rooms-panel-footer"><FiPower /><span>Open a room to add devices and manage your switches.</span></footer>
      </section>
      {editor && <PopupDialog title={editor === "new" ? "Create a room" : "Rename room"} description="A dedicated space for the devices you use every day." icon={<FiHome />} busy={saving} onClose={() => { setEditor(null); setError(""); }}>
        <form className="popup-form" onSubmit={save} aria-busy={saving}>
          <label className="popup-field" htmlFor="room-name">Room name<input id="room-name" className="manage-input" placeholder="e.g. Living room" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} disabled={saving} autoFocus /><small>Choose a name that makes this space easy to find.</small></label>
          {error && <div className="manage-notice" role="alert">{error}</div>}
          <footer className="popup-actions"><button className="manage-secondary" type="button" disabled={saving} onClick={() => { setEditor(null); setError(""); }}>Cancel</button><button className="workspace-button" disabled={saving || !name.trim()}><FiPlus />{saving ? "Saving room..." : editor === "new" ? "Create room" : "Save changes"}</button></footer>
        </form>
      </PopupDialog>}
    </main>
  );
}
