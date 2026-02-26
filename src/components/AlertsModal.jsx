// src/components/AlertsModal.jsx
import React, { useEffect } from "react";

export default function AlertsModal({ open, onClose, prediction, suggestions }) {
  const list = Array.isArray(suggestions) ? suggestions : [];

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modalTitle">Health Alert</div>

        <div className="modalBody">
          <div><b>Condition:</b> {prediction?.label ?? "-"}</div>
          <div><b>Severity:</b> {Math.round(prediction?.severity ?? 0)}/100</div>
          <div><b>Confidence:</b> {Math.round((prediction?.confidence ?? 0) * 100)}%</div>

          <div className="modalSubTitle">Suggestions</div>
          {list.length ? (
            <ul className="list">
              {list.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          ) : (
            <div className="smallText">No suggestions available.</div>
          )}

          <div className="note">
            This dashboard provides screening support only. For critical symptoms, consult a doctor immediately.
          </div>
        </div>

        <div className="modalActions">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
