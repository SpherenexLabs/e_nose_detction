import React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from "recharts";

function ChartBox({ title, children }) {
  return (
    <div className="chartBox">
      <div className="chartTitle">{title}</div>
      <div className="chartArea">{children}</div>
    </div>
  );
}

export default function SensorCharts({ series }) {
  // series: [{t, gas, sound, gas_raw, sound_raw, temperature, humidity}]
  const fmt = (v) => (typeof v === "number" ? Math.round(v) : v);
  const gridColor = "rgba(255,255,255,0.08)";
  const tickColor = "#9fa7bd";
  const tooltipStyle = {
    backgroundColor: "#12182f",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
  };

  return (
    <div className="chartsGrid">
      <ChartBox title="Combined (Gas + Sound)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="t" tick={{ fontSize: 11, fill: tickColor }} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} />
            <Tooltip formatter={fmt} contentStyle={tooltipStyle} labelStyle={{ color: "#d9e2ff" }} />
            <Legend />
            <Line type="monotone" dataKey="gas" dot={false} stroke="#22d3ee" strokeWidth={2.2} />
            <Line type="monotone" dataKey="sound" dot={false} stroke="#60a5fa" strokeWidth={2.2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Gas (mapped)">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="t" tick={{ fontSize: 11, fill: tickColor }} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} />
            <Tooltip formatter={fmt} contentStyle={tooltipStyle} labelStyle={{ color: "#d9e2ff" }} />
            <Line type="monotone" dataKey="gas" dot={false} stroke="#22d3ee" strokeWidth={2.2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Sound (mapped)">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="t" tick={{ fontSize: 11, fill: tickColor }} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} />
            <Tooltip formatter={fmt} contentStyle={tooltipStyle} labelStyle={{ color: "#d9e2ff" }} />
            <Line type="monotone" dataKey="sound" dot={false} stroke="#60a5fa" strokeWidth={2.2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Temperature + Humidity">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="t" tick={{ fontSize: 11, fill: tickColor }} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} />
            <Tooltip formatter={fmt} contentStyle={tooltipStyle} labelStyle={{ color: "#d9e2ff" }} />
            <Legend />
            <Line type="monotone" dataKey="temperature" dot={false} stroke="#f59e0b" strokeWidth={2.2} />
            <Line type="monotone" dataKey="humidity" dot={false} stroke="#34d399" strokeWidth={2.2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>

      <ChartBox title="Raw Signals (gas_raw + sound_raw)">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="t" tick={{ fontSize: 11, fill: tickColor }} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} />
            <Tooltip formatter={fmt} contentStyle={tooltipStyle} labelStyle={{ color: "#d9e2ff" }} />
            <Legend />
            <Line type="monotone" dataKey="gas_raw" dot={false} stroke="#22d3ee" strokeWidth={2.2} />
            <Line type="monotone" dataKey="sound_raw" dot={false} stroke="#c084fc" strokeWidth={2.2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartBox>
    </div>
  );
}
    