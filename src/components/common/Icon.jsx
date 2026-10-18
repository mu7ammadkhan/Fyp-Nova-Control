import { FiHome, FiGrid, FiLogOut, FiMoon, FiSun, FiMenu, FiEdit, FiTrash2, FiMoreVertical, FiArrowLeft, FiShield, FiWind, FiThermometer, FiZap, FiPower } from "react-icons/fi";

const icons = {
  "fa-house": FiHome,
  "fa-door-open": FiHome,
  "fa-table-cells-large": FiGrid,
  "fa-right-from-bracket": FiLogOut,
  "fa-moon": FiMoon,
  "fa-sun": FiSun,
  "fa-bars": FiMenu,
  "fa-pen-to-square": FiEdit,
  "fa-trash-can": FiTrash2,
  "fa-ellipsis-vertical": FiMoreVertical,
  "fa-arrow-left": FiArrowLeft,
  "fa-shield-halved": FiShield,
  "fa-fan": FiWind,
  "fa-snowflake": FiThermometer,
  "fa-temperature-low": FiThermometer,
  "fa-lightbulb": FiZap,
  "fa-plug": FiPower,
};

export default function Icon({ className = "", ...props }) {
  const Component = className.split(" ").map((name) => icons[name]).find(Boolean) || FiHome;
  return <Component className={className} aria-hidden="true" {...props} />;
}
