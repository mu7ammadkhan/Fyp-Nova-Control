import { roomPath } from "../../routes/paths";
import Icon from "../common/Icon";
// FILE: src/components/rooms/RoomCard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RoomMenu from "./RoomMenu";
import { countDevicesInRoom } from "../../services/devices";

export default function RoomCard({ uid, room, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(room.name || "");
  const [count, setCount] = useState(null);

  useEffect(()=> {
    if (!uid || !room?.id) return;
    let live = true;
    (async ()=>{
      try {
        const c = await countDevicesInRoom(uid, room.id);
        if (live) setCount(c);
      } catch { /* Optional UI cleanup may fail if the element is already gone. */ }
    })();
    return ()=>{ live=false; };
  }, [uid, room?.id]);

  const saveRename = async () => {
    const newName = name.trim();
    if (!newName || newName === room.name) { setEditing(false); return; }
    await onRename(room.id, newName);
    setEditing(false);
  };

  return (
    <div className="card-neo p-3 h-100 room-card">
      <div className="d-flex align-items-start gap-3">
        <div className="room-icon">
          <Icon className="fa-solid fa-door-open" />
        </div>

        <div className="flex-grow-1">
          {!editing ? (
            <>
              <div className="d-flex align-items-center">
                <Link to={roomPath(room.id)} className="stretched-link text-decoration-none">
                  <h6 className="mb-0">{room.name}</h6>
                </Link>
                <div className="ms-2">
                  <span className="badge bg-light text-dark border" title="Devices in this room">
                    {count === null ? "…" : `${count} device${count===1?"":"s"}`}
                  </span>
                </div>
                <div className="ms-auto">
                  <RoomMenu onEdit={() => setEditing(true)} onDelete={() => onDelete(room.id)} />
                </div>
              </div>
              <div className="small text-muted mt-1">
                Code: <span className="fw-semibold">{room.code}</span>
              </div>
              <div className="mt-2 d-flex gap-2">
                <Link className="btn btn-sm btn-outline-primary rounded-pill" to={roomPath(room.id)}>
                  Manage devices
                </Link>
              </div>
            </>
          ) : (
            <div className="d-grid gap-2">
              <input
                className="form-control input-underline"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Room name"
              />
              <div className="d-flex gap-2">
                <button className="btn btn-primary btn-sm" onClick={saveRename}>Save</button>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => { setName(room.name); setEditing(false); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
