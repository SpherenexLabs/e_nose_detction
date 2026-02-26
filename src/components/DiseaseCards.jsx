// src/components/DiseaseCards.jsx
import React from "react";
import { severityColor } from "../utils/prediction";

function DCard({ title, severity, active }) {
  const c = severityColor(severity);
  return (
    <div className={`card ${active ? "activeCard" : ""}`}>
      <div className="cardLabel">{title}</div>
      <div className="cardValue">
        {Math.round(severity)} <span className="unit">/100</span>
      </div>
      <div className={`miniPill ${c}`}>{c.toUpperCase()}</div>
    </div>
  );
}

export default function DiseaseCards({ prediction }) {
  const d = prediction?.diseases;
  if (!d) return null;

  return (
    <div className="gridCards" style={{ marginTop: 10 }}>
      <DCard title="Asthma Risk" severity={d.asthma.severity} active={prediction.label === "Asthma"} />
      <DCard title="Wheezing Risk" severity={d.wheezing.severity} active={prediction.label === "Wheezing"} />
      <DCard title="TB Risk" severity={d.tb.severity} active={prediction.label === "Suspected TB"} />
    </div>
  );
}
