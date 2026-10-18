import Icon from "../common/Icon";
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
        <Icon className="fa-solid fa-ellipsis-vertical" />
      </button>
      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`roomMenu-${id}`}>
        <li>
          <button className="dropdown-item" onClick={onEdit}>
            <Icon className="fa-regular fa-pen-to-square me-2" /> Rename
          </button>
        </li>
        <li>
          <button className="dropdown-item text-danger" onClick={onDelete}>
            <Icon className="fa-regular fa-trash-can me-2" /> Delete
          </button>
        </li>
      </ul>
    </div>
  );
}
