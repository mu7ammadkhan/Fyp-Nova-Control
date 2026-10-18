import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import "./PopupDialog.css";

export default function PopupDialog({ title, description, icon, busy = false, onClose, children }) {
  const dialog = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return createPortal(<dialog ref={dialog} className="workspace-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget || busy) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <div className="popup-content">
      <header className="popup-heading"><span className="popup-icon">{icon}</span><button type="button" className="popup-close" aria-label="Close dialog" disabled={busy} onClick={onClose}><FiX /></button></header>
      <div className="popup-intro"><span className="workspace-eyebrow">NOVA CONTROL</span><h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p></div>
      {children}
    </div>
  </dialog>, document.body);
}
