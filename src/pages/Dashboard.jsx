// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { getRooms } from "../services/rooms";
import { onAllDevices } from "../services/devices";

export default function Dashboard() {
  const { user } = useAuthContext();
  const uid = user?.uid;

  const [rooms, setRooms] = useState([]);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    if (!uid) return;

    (async () => setRooms(await getRooms(uid)))();

    const unsub = onAllDevices(uid, setDevices);
    return () => unsub && unsub();
  }, [uid]);

  const totalRooms = rooms.length;
  const totalDevices = devices.length;
  const activeDevices = devices.filter((d) => !!d.state).length;

  return (
    <div className="container py-4 page-fade">
      <h2 className="mb-3">Dashboard</h2>

      {/* ✅ Professional, consistent English copy */}
      <p className="text-muted">
        Overview of rooms, devices and system activity.
      </p>

      {/* ✅ Only 4 overview cards (as you requested) */}
      <div className="row g-3 mb-3">
        <div className="col-md-3">
          <div className="card-neo p-3">
            <div className="small text-muted">Total Rooms</div>
            <div className="h3 mb-0">{totalRooms}</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card-neo p-3">
            <div className="small text-muted">Total Devices</div>
            <div className="h3 mb-0">{totalDevices}</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card-neo p-3">
            <div className="small text-muted">Active Devices</div>
            <div className="h3 mb-0">{activeDevices}</div>
          </div>
        </div>
      </div>

      {/* ❌ Removed: Manage Rooms / Manage Devices / Schedules tile / Profile tile */}
    </div>
  );
}
