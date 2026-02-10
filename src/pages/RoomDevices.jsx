// src/pages/RoomDevices.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { getRooms } from "../services/rooms";
import {
  addDevice,
  onDevicesByRoom,
  setDeviceState,
  renameDevice,
  removeDevice,
} from "../services/devices";

function typeIcon(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("fan")) return "fa-fan";
  if (t.includes("ac")) return "fa-snowflake";
  if (t.includes("fridge")) return "fa-temperature-low";
  if (t.includes("light")) return "fa-lightbulb";
  return "fa-plug";
}

export default function RoomDevices() {
  const { roomId } = useParams();
  const { user } = useAuthContext();
  const uid = user?.uid;

  const [room, setRoom] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dName, setDName] = useState("");
  const [dType, setDType] = useState("Light");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!uid || !roomId) return;

    setLoading(true);
    (async () => {
      const rooms = await getRooms(uid);
      setRoom(rooms.find((r) => r.id === roomId) || null);
      setLoading(false);
    })();

    const unsub = onDevicesByRoom(uid, roomId, setDevices);
    return () => unsub && unsub();
  }, [uid, roomId]);

  const headerTitle = useMemo(() => room?.name || "Room", [room]);

  const stats = useMemo(() => {
    const total = devices.length;
    const active = devices.filter((d) => !!d.state).length;
    return { total, active };
  }, [devices]);

  const handleAdd = async () => {
    setErr("");
    const name = dName.trim();
    if (!name) return setErr("Please enter device name.");

    setSaving(true);
    try {
      await addDevice(uid, {
        name,
        type: dType,
        roomId,
        roomName: room?.name || "",
        pin: dType === "Light" ? 2 : null,
      });
      setDName("");
    } catch (e) {
      setErr(e?.message || "Failed to add device.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (id, next) => {
    await setDeviceState(uid, id, next);
  };

  const onRename = async (id) => {
    const cur = devices.find((d) => d.id === id);
    const name = prompt("New name:", cur?.name || "");
    if (!name) return;
    await renameDevice(uid, id, name);
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this device?")) return;
    await removeDevice(uid, id);
  };

  if (!uid) return null;

  return (
    <div className="container py-4 page-fade">
      {/* Header */}
      <div className="roomd-head mb-3">
        <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
          <div>
            <div className="roomd-breadcrumb text-muted small">
              <Link to="/room" className="text-decoration-none">
                Rooms
              </Link>
              <span className="mx-2">/</span>
              <span>{headerTitle}</span>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h3 className="mb-0">{headerTitle}</h3>
              <span className="badge room-chip">{stats.total} devices</span>
              <span className={`badge room-pill ${stats.active > 0 ? "pill-on" : "pill-off"}`}>
                {stats.active > 0 ? `${stats.active} ON` : "All OFF"}
              </span>
            </div>

            <div className="text-muted mt-1">
              Add and control devices inside this room.
            </div>
          </div>

          <Link className="btn roomd-back" to="/room">
            <i className="fa-solid fa-arrow-left me-2"></i>
            All Rooms
          </Link>
        </div>
      </div>

      {/* Add device form */}
      <div className="glass-panel p-3 mb-3">
        <div className="row g-3 align-items-end">
          <div className="col-md">
            <label className="form-label small text-muted mb-1">Device name</label>
            <input
              className="form-control input-underline"
              placeholder="e.g., Main Light"
              value={dName}
              onChange={(e) => setDName(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small text-muted mb-1">Type</label>
            <select
              className="form-select input-underline"
              value={dType}
              onChange={(e) => setDType(e.target.value)}
            >
              <option>Light</option>
              <option>Fan</option>
              <option>AC</option>
              <option>Fridge</option>
              <option>Other</option>
            </select>
          </div>

          <div className="col-md-auto">
            <button className="btn roomd-primary" onClick={handleAdd} disabled={saving}>
              {saving ? "Adding..." : "Add Device"}
            </button>
          </div>
        </div>

        {err && <div className="alert alert-warning py-2 px-3 mt-2 mb-0">{err}</div>}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-muted">Loading…</div>
      ) : devices.length === 0 ? (
        <div className="text-muted">No devices yet. Add one above.</div>
      ) : (
        <div className="row g-3">
          {devices.map((d) => {
            const isOn = !!d.state;
            return (
              <div className="col-12 col-md-6 col-lg-4" key={d.id}>
                <div className={`device-glass h-100 ${isOn ? "is-on" : "is-off"}`}>
                  <div className="device-top">
                    <div className="device-iconbox">
                      <i className={`fa-solid ${typeIcon(d.type)}`}></i>
                    </div>

                    <div className="flex-grow-1">
                      <div className="device-title-row">
                        <div className="device-title">{d.name}</div>
                        <span className={`device-dot ${isOn ? "dot-on" : "dot-off"}`}></span>
                      </div>

                      <div className="device-sub text-muted">
                        <span className="me-2">{d.type}</span>
                        <span className="device-sep">•</span>
                        <span className="ms-2">
                          ID: <span className="device-id">{d.deviceId}</span>
                        </span>
                      </div>
                    </div>

                    <div className="dropdown">
                      <button className="btn btn-sm room-kebab" data-bs-toggle="dropdown">
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                          <button className="dropdown-item" onClick={() => onRename(d.id)}>
                            Rename
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item text-danger" onClick={() => onDelete(d.id)}>
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="device-bottom">
                    <span className={`badge room-pill ${isOn ? "pill-on" : "pill-off"}`}>
                      {isOn ? "ON" : "OFF"}
                    </span>

                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input device-switch"
                        type="checkbox"
                        checked={isOn}
                        onChange={(e) => toggle(d.id, e.target.checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
