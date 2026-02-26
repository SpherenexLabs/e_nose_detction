import React from "react";
import { severityColor } from "../utils/prediction";

export default function HealthStatus({ prediction }) {
  const c = severityColor(prediction.severity);

  return (
    <div className="statusBox">
      <div className="statusLeft">
        <div className="statusTitle">Prediction</div>
        <div className="statusLabel">{prediction.label}</div>
        <div className="statusMeta">
          Severity: <b>{Math.round(prediction.severity)}</b>/100 • Confidence: <b>{Math.round(prediction.confidence * 100)}%</b>
        </div>
      </div>
      <div className={`statusPill ${c}`}>
        {c.toUpperCase()}
      </div>
    </div>
  );
}
