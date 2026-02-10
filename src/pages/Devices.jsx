// src/pages/Devices.jsx
import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import {
  onAllDevices,
  setDeviceState,
  removeDevice,
  renameDevice,
} from "../services/devices";

// ✅ React Icons
import {
  FaFan,
  FaSnowflake,
  FaTemperatureLow,
  FaLightbulb,
  FaPlug,
  FaEllipsisV,
} from "react-icons/fa";

// ✅ Framer Motion
import { motion } from "framer-motion";

// ✅ Chatbot
import Chatbot from "../components/chatbot/Chatbot";

// Map device type to React Icon component
function typeIcon(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("fan")) return <FaFan />;
  if (t.includes("ac")) return <FaSnowflake />;
  if (t.includes("fridge")) return <FaTemperatureLow />;
  if (t.includes("light")) return <FaLightbulb />;
  return <FaPlug />;
}

export default function DevicesPage() {
  const { user } = useAuthContext();
  const uid = user?.uid;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);

    const unsub = onAllDevices(uid, (rows) => {
      // ✅ Ensure 'deviceId' field from Firebase is used
      const devicesWithDeviceId = rows.map((d) => ({
        ...d,
        deviceId: d.deviceId || "", // fallback
      }));
      setList(devicesWithDeviceId);
      setLoading(false);
    });

    return () => unsub && unsub();
  }, [uid]);

  const toggle = async (id, next) => setDeviceState(uid, id, next);

  const onRename = async (id) => {
    const cur = list.find((d) => d.id === id);
    const name = prompt("New name:", cur?.name || "");
    if (!name) return;
    await renameDevice(uid, id, name);
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete device?")) return;
    await removeDevice(uid, id);
  };

  return (
    <>
      <div className="container py-4 page-fade">
        <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-3">
          <div>
            <h3 className="mb-1">All Devices</h3>
            <div className="text-muted">Control everything from one place.</div>
          </div>
          <span className="badge room-chip bg-primary">
            {list.length} total
          </span>
        </div>

        {loading ? (
          <div className="text-muted">Loading…</div>
        ) : list.length === 0 ? (
          <div className="text-muted">
            No devices yet. Add some from a Room.
          </div>
        ) : (
          <div className="row g-3">
            {list.map((d) => {
              const isOn = !!d.state;

              return (
                <motion.div
                  key={d.id} // document key for React
                  className="col-12 col-md-6 col-lg-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`device-glass h-100 ${isOn ? "is-on" : "is-off"}`}
                  >
                    <div className="device-top">
                      <div className="device-iconbox">{typeIcon(d.type)}</div>

                      <div className="flex-grow-1">
                        <div className="device-title-row">
                          <div className="device-title">
                            {d.name}{" "}
                            <span className="badge room-chip ms-2 bg-primary">
                              {d.type}
                            </span>
                          </div>
                          <span
                            className={`device-dot ${isOn ? "dot-on" : "dot-off"}`}
                          ></span>
                        </div>
                        <div className="device-sub text-muted">
                          <span>Room: {d.roomName || d.roomId}</span>
                        </div>
                      </div>

                      <div className="dropdown">
                        <button
                          className="btn btn-sm room-kebab"
                          data-bs-toggle="dropdown"
                          type="button"
                        >
                          <FaEllipsisV />
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                          <li>
                            <button
                              className="dropdown-item"
                              onClick={() => onRename(d.id)}
                              type="button"
                            >
                              Rename
                            </button>
                          </li>
                          <li>
                            <button
                              className="dropdown-item text-danger"
                              onClick={() => onDelete(d.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="device-bottom">
                      <span
                        className={`badge room-pill ${isOn ? "pill-on" : "pill-off"}`}
                      >
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
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chatbot floating */}
      <Chatbot devices={list} uid={uid} />
    </>
  );
}
