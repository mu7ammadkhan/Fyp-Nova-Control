import { paths } from "../routes/paths";
import "../manage.css";
import "../devices.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { FiPlus, FiSearch, FiPower, FiLayers, FiGrid, FiMoon, FiArrowRight, FiX } from "react-icons/fi";
import { useAuthContext } from "../hooks/useAuth";
import { useHomeData } from "../hooks/useHomeData";
import { useDeviceConnection } from "../hooks/useDeviceConnection";
import DeviceCard from "../components/devices/DeviceCard";
import Chatbot from "../components/chatbot/Chatbot";

export default function DevicesPage() {
  useDeviceConnection();
  const { user } = useAuthContext();
  const { devices, rooms, devicesLoaded, roomsLoaded, devicesError } = useHomeData(user.uid);
  const [search, setSearch] = useState("");
  const [room, setRoom] = useState("");
  const [filter, setFilter] = useState("all");
  const active = devices.filter((device) => device.state).length;
  const names = new Map(rooms.map((item) => [item.id, item.name]));
  const occupied = rooms.filter((item) => devices.some((device) => device.roomId === item.id)).length;
  const visible = devices.filter((device) => device.name.toLowerCase().includes(search.trim().toLowerCase()) && (!room || device.roomId === room) && (filter === "all" || !!device.state === (filter === "on")));
  const filtered = !!search || !!room || filter !== "all";
  const clearFilters = () => {setSearch("");setRoom("");setFilter("all");};
  const stats = [
    {label:"Total devices",value:devices.length,note:"All your home essentials",icon:<FiLayers />,color:"blue",ready:devicesLoaded},
    {label:"Switched on",value:active,note:"Devices currently set to ON",icon:<FiPower />,color:"green",ready:devicesLoaded},
    {label:"Switched off",value:devices.length-active,note:"Devices currently set to OFF",icon:<FiMoon />,color:"orange",ready:devicesLoaded},
    {label:"Rooms with devices",value:occupied,note:"Your connected spaces",icon:<FiGrid />,color:"purple",ready:devicesLoaded && roomsLoaded},
  ];
  return <main className="container dashboard-page devices-dashboard-page">
    <header className="dashboard-heading"><div><span className="workspace-eyebrow">YOUR HOME, UNDER CONTROL</span><h1>Devices</h1><p>One place for every switch in your home.</p></div><Link className="workspace-button" to={paths.rooms}><FiPlus /> Add a device</Link></header>
    <section className="dashboard-welcome devices-welcome"><div><span className="dashboard-welcome-label"><FiPower /> DEVICE CONTROL</span><h2>Every device. One place.</h2><p>From the first light to the last fan.<br />Make your home work the way you want.</p><Link to={paths.rooms}>Explore your rooms <FiArrowRight /></Link></div><div className="devices-hero-art" aria-hidden="true"><span className="devices-hero-orbit" /><span className="devices-hero-orbit orbit-outer" /><div className="devices-hero-power"><FiPower /></div><span className="devices-hero-chip"><i />{devicesLoaded ? `${active} switched on` : "Your home controls"}</span></div></section>
    <section className="dashboard-stats" aria-label="Device statistics">{stats.map((stat) => <article className="dashboard-stat" key={stat.label}><div className="stat-top"><span>{stat.label}</span><span className={`stat-icon ${stat.color}`}>{stat.icon}</span></div><strong>{stat.ready ? stat.value : "—"}</strong><p>{stat.note}</p></article>)}</section>
    {devicesError && <div className="manage-notice" role="alert">{devicesError}</div>}
    <section className="devices-control-panel" aria-labelledby="device-controls-title"><header className="devices-section-heading"><div><h2 id="device-controls-title">Your device controls</h2><p>A simple switch for a more comfortable home.</p></div><span className="devices-result-count">{devicesLoaded ? `${visible.length} ${visible.length === 1 ? "device" : "devices"}` : "Syncing devices"}</span></header>
      <div className="manage-toolbar device-toolbar"><div className="manage-tabs" aria-label="Filter devices">{[["all","All devices",devices.length],["on","On",active],["off","Off",devices.length-active]].map(([value,label,count]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<span>{devicesLoaded ? count : "—"}</span></button>)}</div><div className="manage-filters"><label className="manage-search"><FiSearch /><input aria-label="Search devices" placeholder="Search devices..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><select className="manage-input" aria-label="Filter by room" value={room} onChange={(event) => setRoom(event.target.value)}><option value="">All rooms</option>{rooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div></div>
      {filtered && <div className="devices-filter-summary"><span>Showing matching devices</span><button onClick={clearFilters}><FiX />Clear filters</button></div>}
      {!devicesLoaded ? <div className="manage-grid device-control-grid" role="status" aria-label="Loading devices">{[1,2,3,4].map((id) => <div className="manage-skeleton" key={id}><span /><span /><span /></div>)}</div> : visible.length ? <div className="manage-grid device-control-grid">{visible.map((device) => <DeviceCard key={device.id} device={device} uid={user.uid} roomName={names.get(device.roomId)} />)}</div> : !devicesError && <div className="manage-empty"><FiLayers /><h2>{devices.length ? "No matching devices" : "Your devices belong here"}</h2><p>{devices.length ? "Try a different search or room to find your device." : "Open a room to add your first light, fan or appliance."}</p>{devices.length ? <button className="workspace-button" onClick={clearFilters}>Clear filters</button> : <Link className="workspace-button" to={paths.rooms}>Explore rooms <FiArrowRight /></Link>}</div>}
      <footer className="devices-panel-footer"><FiPower /><span>ON and OFF reflect your saved switch commands.</span></footer>
    </section>
    <Chatbot devices={devices} uid={user.uid} />
  </main>;
}
