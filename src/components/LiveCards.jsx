import React from "react";

function Card({ label, value, unit }) {
  return (
    <div className="card">
      <div className="cardLabel">{label}</div>
      <div className="cardValue">
        {value}{unit ? <span className="unit"> {unit}</span> : null}
      </div>
    </div>
  );
}

export default function LiveCards({ live }) {
  return (
    <div className="gridCards">
      <Card label="VOC / Gas (mapped)" value={live.gas ?? 0} unit="" />
      <Card label="Sound (mapped)" value={live.sound ?? 0} unit="" />
      <Card label="Gas Raw" value={live.gas_raw ?? 0} unit="" />
      <Card label="Sound Raw" value={live.sound_raw ?? 0} unit="" />
      <Card label="Temperature" value={live.temperature ?? -1} unit="°C" />
      <Card label="Humidity" value={live.humidity ?? -1} unit="%" />
    </div>
  );
}
