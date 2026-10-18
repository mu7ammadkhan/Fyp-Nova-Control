import { paths, roomPath } from "../routes/paths";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiArrowRight, FiHome, FiGrid, FiPower, FiMoon, FiSun, FiLayers } from "react-icons/fi";
import { useAuthContext } from "../hooks/useAuth";
import { useHomeData } from "../hooks/useHomeData";

export default function Dashboard() {
  const { user } = useAuthContext();
  const uid = user?.uid;
  const { rooms, devices, profile, roomsLoaded, devicesLoaded, roomsError, devicesError } = useHomeData(uid);
  const loading = !roomsLoaded;
  const devicesLoading = !devicesLoaded;
  const error = roomsError || devicesError;
  const active = devices.filter((device) => !!device.state).length;
  const name = profile?.name?.trim() || user?.displayName?.trim() || "";
  const stats = [
    { label: "Total rooms", value: rooms.length, note: "Spaces in your home", icon: <FiGrid />, color: "blue", pending: loading },
    { label: "Total devices", value: devices.length, note: "All your connected essentials", icon: <FiLayers />, color: "purple", pending: devicesLoading },
    { label: "Switched on", value: active, note: "Devices currently set to ON", icon: <FiPower />, color: "green", pending: devicesLoading },
    { label: "Switched off", value: devices.length - active, note: "Devices currently set to OFF", icon: <FiMoon />, color: "orange", pending: devicesLoading },
  ];
  return (
    <main className="container dashboard-page page-fade">
      <div className="dashboard-heading"><div><span className="workspace-eyebrow">YOUR HOME AT A GLANCE</span><h1>Dashboard</h1><p>A little more comfort. A lot more control.</p></div><Link className="workspace-button" to={paths.devices}>Manage devices <FiArrowUpRight /></Link></div>
      {error && <div className="alert alert-warning" role="alert">{error}</div>}
      <section className="dashboard-welcome"><div><span className="dashboard-welcome-label"><FiSun /> WELCOME HOME</span><h2>Welcome back{name ? `, ${name}` : ""}.</h2><p>Your favorite spaces, all in one place.<br />Make yourself comfortable. You’re in control.</p><Link to={paths.rooms}>Explore your rooms <FiArrowRight /></Link></div><div className="dashboard-home-art" aria-hidden="true"><span className="home-art-orbit orbit-one" /><span className="home-art-orbit orbit-two" /><div className="home-art-center"><FiHome /></div><span className="home-art-chip chip-top"><FiGrid /> {loading ? "…" : rooms.length} rooms</span><span className="home-art-chip chip-bottom"><FiPower /> {devicesLoading ? "…" : active} switched on</span></div></section>
      <section className="dashboard-stats" aria-label="Home statistics">{stats.map((stat) => <article className="dashboard-stat" key={stat.label}><div className="stat-top"><span>{stat.label}</span><span className={`stat-icon ${stat.color}`}>{stat.icon}</span></div><strong>{stat.pending ? "—" : stat.value}</strong><p>{stat.note}</p></article>)}</section>
      <div className="dashboard-bottom">
        <section className="workspace-panel"><header><div><h2>Your rooms</h2><p>A space for everything.</p></div><Link to={paths.rooms}>View all <FiArrowUpRight /></Link></header>
          {loading ? <p className="dashboard-empty" role="status">Loading your rooms…</p> : rooms.length ? <div className="dashboard-room-list">{rooms.slice(0, 4).map((room) => { const count = devices.filter((device) => device.roomId === room.id).length; return <Link key={room.id} to={roomPath(room.id)}><span className="dashboard-room-icon"><FiHome /></span><div><strong>{room.name}</strong><span>{devicesLoading ? "Loading devices…" : `${count} ${count === 1 ? "device" : "devices"}`}</span></div><FiArrowUpRight /></Link>; })}</div> : <div className="dashboard-empty"><FiHome /><h3>Make room for smarter living</h3><p>Add your first room, then bring your devices together.</p><Link className="workspace-button" to={paths.rooms}>Add your first room <FiArrowRight /></Link></div>}
        </section>
        <section className="workspace-panel"><header><div><h2>Device overview</h2><p>A quick look at your switches.</p></div><Link to={paths.devices}>View all <FiArrowUpRight /></Link></header>{devicesLoading ? <p className="dashboard-empty" role="status">Loading your devices…</p> : <><div className="dashboard-device-summary"><div className="device-summary-ring" style={{ "--active-angle": `${devices.length ? active / devices.length * 360 : 0}deg` }}><div><strong>{devices.length}</strong><span>total devices</span></div></div><div className="device-summary-legend"><span><i className="legend-on" />Switched on <strong>{active}</strong></span><span><i className="legend-off" />Switched off <strong>{devices.length - active}</strong></span></div></div><p className="dashboard-state-note">Switch states reflect your saved commands.</p></>}</section>
      </div>
    </main>
  );
}
