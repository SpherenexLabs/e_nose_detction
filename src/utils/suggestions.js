// src/utils/suggestions.js
function toInt(value) {
  return Math.round(Number(value ?? 0));
}

export function getSuggestions({ prediction, live, counters, thresholds }) {
  const label = prediction?.label || "Normal";
  const severity = toInt(prediction?.severity);
  const confidence = toInt((prediction?.confidence || 0) * 100);

  const asthmaRisk = toInt(prediction?.risks?.asthma);
  const wheezeRisk = toInt(prediction?.risks?.wheeze);
  const tbRisk = toInt(prediction?.risks?.tb);

  const gasRaw = toInt(live?.gas_raw);
  const soundRaw = toInt(live?.sound_raw);
  const gasThrAsthma = toInt(thresholds?.asthma?.gasRawHigh);
  const soundThrAsthma = toInt(thresholds?.asthma?.soundRawHigh);
  const soundThrWheeze = toInt(thresholds?.wheeze?.soundRawHigh);
  const gasThrTb = toInt(thresholds?.tb?.gasRawHigh);
  const soundThrTb = toInt(thresholds?.tb?.soundRawHigh);
  const alertThr = toInt(thresholds?.alertSeverity);

  const lines = [
    `Realtime prediction: ${label} • Severity ${severity}/100 • Confidence ${confidence}%`,
    `Current signals: gas_raw ${gasRaw}, sound_raw ${soundRaw}, alert threshold ${alertThr}`,
  ];

  if (label === "Normal") {
    lines.push("Pattern is currently stable. Continue realtime monitoring and avoid smoke/dust exposure.");
    lines.push(`Risk scores now: Asthma ${asthmaRisk}, Wheezing ${wheezeRisk}, TB ${tbRisk}.`);
    return lines;
  }

  if (label === "Asthma") {
    const asthmaDur = toInt(counters?.asthmaSec);
    lines.push(
      `Asthma drivers: gas_raw ${gasRaw}/${gasThrAsthma}, sound_raw ${soundRaw}/${soundThrAsthma}, sustained ${asthmaDur}s.`
    );
    lines.push(
      severity >= 60
        ? "High asthma-risk pattern detected. Follow prescribed inhaler plan and seek urgent care if breathing worsens."
        : "Moderate asthma-risk pattern detected. Reduce exertion, avoid triggers, and continue close monitoring."
    );
  } else if (label === "Wheezing") {
    const wheezeDur = toInt(counters?.wheezeSec);
    lines.push(`Wheezing driver: sound_raw ${soundRaw}/${soundThrWheeze}, sustained ${wheezeDur}s.`);
    lines.push(
      severity >= 60
        ? "Severe wheeze-risk pattern detected. Seek medical advice promptly, especially if shortness of breath increases."
        : "Mild-to-moderate wheeze-risk pattern detected. Avoid allergens/cold air and recheck trend in next minutes."
    );
  } else if (label === "Suspected TB") {
    const tbDur = toInt(counters?.tbSec);
    lines.push(`TB screening drivers: gas_raw ${gasRaw}/${gasThrTb}, sound_raw ${soundRaw}/${soundThrTb}, sustained ${tbDur}s.`);
    lines.push("Screening alert: confirm with clinical tests (sputum/chest X-ray). Do not self-diagnose from device output.");
  }

  if (severity >= alertThr) {
    lines.push("Alert condition met: severity is above configured threshold. Prioritize clinician review.");
  }

  return lines;
}
