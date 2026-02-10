// src/components/devices/DeviceCard.jsx
export default function DeviceCard({ device, onToggle, onRename, onDelete }) {
  return (
    <div className="card-neo p-3 d-flex flex-wrap align-items-center justify-content-between">
      <div className="d-flex align-items-center gap-3">
        <div className="room-icon"><i className="fa-regular fa-lightbulb"></i></div>
        <div>
          <div className="fw-semibold">{device.name} <span className="badge bg-light text-dark ms-1">{device.type}</span></div>
          <div className="small text-muted">Room: {device.roomName || device.roomId}</div>
          <div className="small text-muted">Device ID: <span className="badge bg-secondary-subtle text-dark">{device.deviceId}</span></div>
        </div>
      </div>
      <div className="d-flex align-items-center gap-2">
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" checked={!!device.state} onChange={(e)=>onToggle?.(device.id, e.target.checked)} />
        </div>
        <div className="dropdown">
          <button className="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li><button className="dropdown-item" onClick={()=>onRename?.(device.id)}>Rename</button></li>
            <li><button className="dropdown-item text-danger" onClick={()=>onDelete?.(device.id)}>Delete</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
