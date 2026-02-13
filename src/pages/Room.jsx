// src/pages/Room.jsx
import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { addRoom, getRooms, renameRoom, removeRoom } from "../services/rooms";
import { countDevicesInRoom } from "../services/devices";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaDoorOpen, FaEllipsisV, FaPlus, FaSave, FaTimes } from "react-icons/fa";

export default function RoomsPage() {
  const { user } = useAuthContext();
  const uid = user?.uid;
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [addErr, setAddErr] = useState("");

  // ✅ Track which dropdown is currently open (for z-index fix)
  const [openMenuId, setOpenMenuId] = useState(null);

  // ✅ Listen to Bootstrap dropdown events globally (works even with framer-motion/backdrop-filter)
  useEffect(() => {
    const onShown = (e) => {
      const btn = e?.target;
      const item = btn?.closest?.("[data-room-id]");
      if (item) setOpenMenuId(item.getAttribute("data-room-id"));
    };

    const onHidden = () => setOpenMenuId(null);

    document.addEventListener("shown.bs.dropdown", onShown);
    document.addEventListener("hidden.bs.dropdown", onHidden);

    return () => {
      document.removeEventListener("shown.bs.dropdown", onShown);
      document.removeEventListener("hidden.bs.dropdown", onHidden);
    };
  }, []);

  // Fetch rooms with device counts
  useEffect(() => {
    if (!uid) return;

    (async () => {
      setLoading(true);
      try {
        const list = await getRooms(uid);

        const withCounts = await Promise.all(
          list.map(async (r) => ({
            ...r,
            deviceCount: await countDevicesInRoom(uid, r.id),
          }))
        );

        setRooms(withCounts);
      } catch (e) {
        console.error("Failed to fetch rooms:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  // Add new room
  const handleAdd = async () => {
    setAddErr("");
    const name = newName.trim();
    if (!name) return setAddErr("Please enter a room name.");

    setSaving(true);
    try {
      const created = await addRoom(uid, name);
      setRooms((cur) => [{ ...created, deviceCount: 0 }, ...cur]);
      setNewName("");
      setShowAdd(false);
    } catch (e) {
      if (e?.code === "name_exists") setAddErr("This name already exists.");
      else setAddErr(e?.message || "Failed to add room.");
    } finally {
      setSaving(false);
    }
  };

  // Rename room
  const handleRename = async (id, name) => {
    try {
      await renameRoom(uid, id, name);
      setRooms((cur) => cur.map((r) => (r.id === id ? { ...r, name } : r)));
    } catch (e) {
      if (e?.code === "name_exists") alert("This name already exists.");
      else alert(e?.message || "Failed to rename room.");
    }
  };

  // Delete room
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this room?")) return;
    try {
      await removeRoom(uid, id);
      setRooms((cur) => cur.filter((r) => r.id !== id));
    } catch (e) {
      alert(e?.message || "Failed to delete room.");
    }
  };

  return (
    <div className="container py-4 page-fade">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h3 className="mb-1">Rooms</h3>
          <p className="text-muted mb-0">Create rooms and map devices via unique ID.</p>
        </div>

        <motion.button
          className="btn btn-primary rounded-pill d-flex align-items-center gap-2"
          onClick={() => setShowAdd((s) => !s)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
        >
          <FaPlus /> Add Room
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="glass-panel p-3 mb-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <label className="form-label small text-muted mb-1">Room name</label>
            <input
              type="text"
              className="form-control input-underline"
              placeholder="e.g., Living Room"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <div className="small text-muted mt-1">
              A unique <strong>Room ID</strong> will be generated automatically.
            </div>

            {addErr && (
              <div className="alert alert-warning py-2 px-3 mt-2 mb-0">{addErr}</div>
            )}

            <div className="mt-3 d-flex gap-2">
              <motion.button
                className="btn roomd-primary d-flex align-items-center gap-1"
                onClick={handleAdd}
                disabled={saving}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
              >
                {saving ? (
                  "Saving..."
                ) : (
                  <>
                    <FaSave /> Save
                  </>
                )}
              </motion.button>

              <motion.button
                className="btn btn-outline-secondary d-flex align-items-center gap-1"
                onClick={() => setShowAdd(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
              >
                <FaTimes /> Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-muted">Loading…</div>
      ) : rooms.length === 0 ? (
        <div className="text-muted">No rooms yet. Add one above.</div>
      ) : (
        <div className="row g-3">
          {rooms.map((r) => (
            <motion.div
              key={r.id}
              data-room-id={r.id}
              className={`col-12 col-md-6 col-lg-4 room-grid-item ${
                openMenuId === r.id ? "room-grid-item--open" : ""
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div
                className="room-tile"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/room/${r.id}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/room/${r.id}`)}
              >
                <div className="room-tile-left d-flex align-items-center gap-3">
                  <div className="room-tile-icon">
                    <FaDoorOpen size={24} />
                  </div>

                  <div className="room-tile-text">
                    <div className="room-tile-name">{r.name}</div>
                    <div className="room-tile-sub text-muted d-flex flex-wrap gap-2">
                      <span className="room-chip">{r.deviceCount} devices</span>
                    </div>
                  </div>
                </div>

                {/* actions */}
                <div className="dropdown">
                  <motion.button
                    className="btn btn-sm room-kebab"
                    data-bs-toggle="dropdown"
                    data-bs-display="static"
                    data-bs-boundary="window"
                    onClick={(e) => e.stopPropagation()}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                  >
                    <FaEllipsisV />
                  </motion.button>

                  <ul
                    className="dropdown-menu dropdown-menu-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <li>
                      <button
                        className="dropdown-item"
                        type="button"
                        onClick={() => {
                          const name = prompt("Enter new name:", r.name);
                          if (name) handleRename(r.id, name);
                        }}
                      >
                        Rename
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        type="button"
                        onClick={() => handleDelete(r.id)}
                      >
                        Delete
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
