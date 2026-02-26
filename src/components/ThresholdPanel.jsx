    import React, { useEffect, useState } from "react";
    import { ref, set, onValue } from "firebase/database";
    import { db } from "../firebase";
    import { DEFAULT_THRESHOLDS } from "../utils/prediction";

    export default function ThresholdPanel({ user, thresholds, setThresholds }) {
    const [local, setLocal] = useState(thresholds || DEFAULT_THRESHOLDS);

    useEffect(() => {
        if (!user) return;
        const r = ref(db, `patients/${user.uid}/settings/thresholds`);
        return onValue(r, (snap) => {
        if (snap.exists()) {
            const next = snap.val();
            setThresholds(next);
            setLocal(next);
        } else {
            setThresholds(DEFAULT_THRESHOLDS);
            setLocal(DEFAULT_THRESHOLDS);
        }
        });
    }, [user, setThresholds]);

    async function save() {
        if (!user) return;
        await set(ref(db, `patients/${user.uid}/settings/thresholds`), local);
        setThresholds(local);
    }

    function update(path, value) {
        setLocal((p) => {
        const copy = JSON.parse(JSON.stringify(p));
        const keys = path.split(".");
        let obj = copy;
        while (keys.length > 1) obj = obj[keys.shift()];
        obj[keys[0]] = Number(value);
        return copy;
        });
    }

    return (
        <div className="panel">
        <div className="panelHead">
            <div className="panelTitle">Threshold Settings</div>
            <button className="btnSmall" onClick={save} disabled={!user}>Save</button>
        </div>

        <div className="thresholdGrid">
            <div className="thCard">
            <div className="thTitle">Asthma</div>
            <label className="thRow">Gas High
                <input className="inputSmall" value={local.asthma.gasHigh} onChange={(e) => update("asthma.gasHigh", e.target.value)} />
            </label>
            <label className="thRow">Sound High
                <input className="inputSmall" value={local.asthma.soundHigh} onChange={(e) => update("asthma.soundHigh", e.target.value)} />
            </label>
            <label className="thRow">Duration (sec)
                <input className="inputSmall" value={local.asthma.durationSec} onChange={(e) => update("asthma.durationSec", e.target.value)} />
            </label>
            </div>

            <div className="thCard">
            <div className="thTitle">Wheezing</div>
            <label className="thRow">Sound High
                <input className="inputSmall" value={local.wheeze.soundHigh} onChange={(e) => update("wheeze.soundHigh", e.target.value)} />
            </label>
            <label className="thRow">Duration (sec)
                <input className="inputSmall" value={local.wheeze.durationSec} onChange={(e) => update("wheeze.durationSec", e.target.value)} />
            </label>
            </div>

            <div className="thCard">
            <div className="thTitle">TB</div>
            <label className="thRow">Gas High
                <input className="inputSmall" value={local.tb.gasHigh} onChange={(e) => update("tb.gasHigh", e.target.value)} />
            </label>
            <label className="thRow">Sound High
                <input className="inputSmall" value={local.tb.soundHigh} onChange={(e) => update("tb.soundHigh", e.target.value)} />
            </label>
            <label className="thRow">Duration (sec)
                <input className="inputSmall" value={local.tb.durationSec} onChange={(e) => update("tb.durationSec", e.target.value)} />
            </label>
            </div>

            <div className="thCard">
            <div className="thTitle">Alerts</div>
            <label className="thRow">Alert Severity
                <input className="inputSmall" value={local.alertSeverity} onChange={(e) => update("alertSeverity", e.target.value)} />
            </label>
            <div className="smallText">Popup triggers when severity ≥ this value.</div>
            </div>
        </div>
        </div>
    );
    }
