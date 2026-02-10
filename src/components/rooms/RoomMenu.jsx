// FILE: src/components/rooms/RoomMenu.jsx  (unchanged from yours, kept for completeness)
import { useId } from "react";

export default function RoomMenu({ onEdit, onDelete }) {
  const id = useId();
  return (
    <div className="dropdown ms-auto">
      <button
        className="btn btn-sm btn-outline-secondary"
        id={`roomMenu-${id}`}
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="fa-solid fa-ellipsis-vertical"></i>
      </button>
      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`roomMenu-${id}`}>
        <li>
          <button className="dropdown-item" onClick={onEdit}>
            <i className="fa-regular fa-pen-to-square me-2"></i> Rename
          </button>
        </li>
        <li>
          <button className="dropdown-item text-danger" onClick={onDelete}>
            <i className="fa-regular fa-trash-can me-2"></i> Delete
          </button>
        </li>
      </ul>
    </div>
  );
}
