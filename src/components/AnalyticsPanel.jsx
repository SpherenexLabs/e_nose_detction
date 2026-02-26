import React from "react";

export default function AnalyticsPanel({ lastSavedAt, savedCount }) {
  return (
    <div className="panel">
      <div className="panelHead">
        <div className="panelTitle">Analytics</div>
      </div>
      <div className="smallText">
        Auto-saving sensor snapshots to history every 5 seconds (while logged in).
      </div>
      <div className="gridCards" style={{ marginTop: 10 }}>
        <div className="card">
          <div className="cardLabel">Saved Records</div>
          <div className="cardValue">{savedCount}</div>
        </div>
        <div className="card">
          <div className="cardLabel">Last Saved</div>
          <div className="cardValue">{lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "-"}</div>
        </div>
      </div>
    </div>
  );
}
