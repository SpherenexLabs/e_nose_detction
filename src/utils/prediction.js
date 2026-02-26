// src/utils/prediction.js
// Uses RAW ADC (0..4095) to compute disease risks and an overall label.

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Default thresholds in RAW ADC units (tune later with real data)
export const DEFAULT_THRESHOLDS = {
  asthma: {
    gasRawHigh: 2600,
    soundRawHigh: 2600,
    durationSec: 30,
  },
  wheeze: {
    soundRawHigh: 3200,
    durationSec: 20,
  },
  tb: {
    gasRawHigh: 2800,
    soundRawHigh: 2200,
    durationSec: 60,
  },
  // Popup triggers when any disease risk >= alertSeverity
  alertSeverity: 35,
};

// Normalize ADC raw to 0..100
export function scoreFromAdc(raw, adcMax = 4095) {
  const v = Number(raw ?? 0);
  return clamp((v / adcMax) * 100, 0, 100);
}

// Optional environment penalty (if invalid sensor = -1)
function envPenalty(temp, hum) {
  if (Number(temp ?? -1) <= -1 || Number(hum ?? -1) <= -1) return 5;
  return 0;
}

/**
 * Compute risk 0..100 for each disease using:
 * - how far raw crosses threshold
 * - how long it stays above threshold (duration counter)
 */
export function computeDiseaseRisks(live, counters, thresholds = DEFAULT_THRESHOLDS) {
  const gasRaw = Number(live?.gas_raw ?? 0);
  const soundRaw = Number(live?.sound_raw ?? 0);

  const gasScore = scoreFromAdc(gasRaw);
  const soundScore = scoreFromAdc(soundRaw);
  const env = envPenalty(live?.temperature, live?.humidity);

  // helper: how much above threshold (0..1)
  const over = (raw, thr) => clamp((raw - thr) / Math.max(1, (4095 - thr)), 0, 1);

  // Asthma risk: gas + sound both high + duration
  const asthmaOver =
    0.55 * over(gasRaw, thresholds.asthma.gasRawHigh) +
    0.45 * over(soundRaw, thresholds.asthma.soundRawHigh);

  const asthmaDur = clamp((counters?.asthmaSec ?? 0) / thresholds.asthma.durationSec, 0, 1);
  const asthmaRisk = clamp(100 * (0.65 * asthmaOver + 0.30 * asthmaDur + 0.05 * (env / 10)), 0, 100);

  // Wheeze risk: sound high + duration
  const wheezeOver = over(soundRaw, thresholds.wheeze.soundRawHigh);
  const wheezeDur = clamp((counters?.wheezeSec ?? 0) / thresholds.wheeze.durationSec, 0, 1);
  const wheezeRisk = clamp(100 * (0.70 * wheezeOver + 0.25 * wheezeDur + 0.05 * (env / 10)), 0, 100);

  // TB risk: persistent gas high + some sound + duration
  const tbOver =
    0.60 * over(gasRaw, thresholds.tb.gasRawHigh) +
    0.40 * over(soundRaw, thresholds.tb.soundRawHigh);

  const tbDur = clamp((counters?.tbSec ?? 0) / thresholds.tb.durationSec, 0, 1);
  const tbRisk = clamp(100 * (0.70 * tbOver + 0.25 * tbDur + 0.05 * (env / 10)), 0, 100);

  // Overall severity = max risk
  const severity = Math.max(asthmaRisk, wheezeRisk, tbRisk);

  // Label = disease with max risk (only if risk >= 25)
  let label = "Normal";
  let top = severity;

  if (top >= 25) {
    if (top === tbRisk) label = "Suspected TB";
    else if (top === wheezeRisk) label = "Wheezing";
    else if (top === asthmaRisk) label = "Asthma";
  }

  // heuristic confidence
  let confidence = 0.70;
  if (label !== "Normal") confidence = clamp(0.55 + severity / 120, 0.55, 0.95);

  return {
    label,
    severity,
    confidence,
    risks: {
      asthma: asthmaRisk,
      wheeze: wheezeRisk,
      tb: tbRisk,
    },
    scores: {
      gasScore,
      soundScore,
    },
  };
}

export function severityColor(severity) {
  if (severity < 30) return "green";
  if (severity < 60) return "yellow";
  if (severity < 80) return "orange";
  return "red";
}
