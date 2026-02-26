import React, { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

import { onAuthStateChanged } from "firebase/auth";
import { get, ref, onValue, push, set, update } from "firebase/database";

import { auth, db } from "./firebase";
import AuthPanel from "./components/AuthPanel";
import HeaderBar from "./components/HeaderBar";
import LiveCards from "./components/LiveCards";
import HealthStatus from "./components/HealthStatus";
import ThresholdPanel from "./components/ThresholdPanel";
import AlertsModal from "./components/AlertsModal";
import SensorCharts from "./components/SensorCharts";
import AnalyticsPanel from "./components/AnalyticsPanel";
import CarePortal from "./components/CarePortal";

import { DEFAULT_THRESHOLDS, computeDiseaseRisks, severityColor } from "./utils/prediction";
import { getSuggestions } from "./utils/suggestions";

const LIVE_PATH = "E_Nose_Detect";
const CREDENTIAL_STORE_PATH = `${LIVE_PATH}/credentialStore`;

const FAKE_DOCTORS = [
  {
    id: "demo-doc-1",
    doctorUid: null,
    name: "Dr. Meera Nair",
    specialization: "Pulmonologist",
    hospital: "City Lung Care",
    experience: "10 years",
    rating: 4.9,
    isDemo: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
  },
  {
    id: "demo-doc-2",
    doctorUid: null,
    name: "Dr. Arjun Patel",
    specialization: "Respiratory Specialist",
    hospital: "BreathWell Clinic",
    experience: "7 years",
    rating: 4.7,
    isDemo: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 9,
  },
  {
    id: "demo-doc-3",
    doctorUid: null,
    name: "Dr. Sana Iqbal",
    specialization: "General Physician",
    hospital: "Prime Family Health",
    experience: "8 years",
    rating: 4.8,
    isDemo: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
];

const FAKE_PATIENTS = [
  { id: "demo-pt-1", name: "John Doe", condition: "Asthma Follow-up", status: "Booked" },
  { id: "demo-pt-2", name: "Jane Smith", condition: "Chronic Wheeze", status: "Prescription Added" },
  { id: "demo-pt-3", name: "Robert Johnson", condition: "TB Screening", status: "Booked" },
  { id: "demo-pt-4", name: "Emily Brown", condition: "Breathing Difficulty", status: "Consulted" },
];

async function upsertCredentialRecord(firebaseUser, extra = {}) {
  if (!firebaseUser?.uid) return;

  const path = `${CREDENTIAL_STORE_PATH}/${firebaseUser.uid}`;
  const now = Date.now();
  const existingSnap = await get(ref(db, path));
  const existing = existingSnap.exists() ? existingSnap.val() : null;

  const payload = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || "",
    role: extra.role || existing?.role || "user",
    name: extra.name || existing?.name || firebaseUser.displayName || "",
    specialization: extra.specialization || existing?.specialization || "",
    hospital: extra.hospital || existing?.hospital || "",
    providerIds: Array.isArray(firebaseUser.providerData)
      ? firebaseUser.providerData.map((p) => p?.providerId).filter(Boolean)
      : [],
    emailVerified: !!firebaseUser.emailVerified,
    createdAt: existing?.createdAt || now,
    lastLoginAt: now,
    updatedAt: now,
  };

  await set(ref(db, path), payload);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [live, setLive] = useState({
    gas: 0,
    sound: 0,
    gas_raw: 0,
    sound_raw: 0,
    temperature: -1,
    humidity: -1,
    timestamp_ms: 0,
  });

  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  // chart series
  const [series, setSeries] = useState([]);
  const maxPoints = 120;

  // duration counters (seconds)
  const [counters, setCounters] = useState({ asthmaSec: 0, wheezeSec: 0, tbSec: 0 });
  const lastTickRef = useRef(0);

  // alert modal
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertOnceLock, setAlertOnceLock] = useState(false);

  // analytics
  const [savedCount, setSavedCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [rtdbError, setRtdbError] = useState(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (!u) {
          setProfile(null);
          setAppointments([]);
        }
      }),
    []
  );

  useEffect(() => {
    const doctorsRef = ref(db, "doctorDirectory");
    const unsub = onValue(doctorsRef, async (snap) => {
      if (snap.exists()) {
        setDoctors(Object.values(snap.val() || {}));
        return;
      }

      const seed = {};
      FAKE_DOCTORS.forEach((doc) => {
        seed[doc.id] = doc;
      });
      await set(doctorsRef, seed);
      setDoctors(FAKE_DOCTORS);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const profileRef = ref(db, `userProfiles/${user.uid}`);
    const unsub = onValue(profileRef, async (snap) => {
      if (snap.exists()) {
        setProfile(snap.val());
        return;
      }

      const defaultProfile = {
        uid: user.uid,
        email: user.email || "",
        name: user.displayName || (user.email ? user.email.split("@")[0] : "User"),
        role: "user",
        createdAt: Date.now(),
      };

      await set(profileRef, defaultProfile);
      await set(ref(db, `accounts/users/${user.uid}`), defaultProfile);
      setProfile(defaultProfile);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || profile?.role !== "doctor") return;

    const doctorRecord = {
      id: user.uid,
      doctorUid: user.uid,
      name: profile.name || "Doctor",
      specialization: profile.specialization || "General Physician",
      hospital: profile.hospital || "e-Nose Health",
      experience: profile.experience || "5 years",
      rating: Number(profile.rating || 4.8),
      isDemo: false,
      email: user.email || "",
      createdAt: profile.createdAt || Date.now(),
    };

    set(ref(db, `doctorDirectory/${user.uid}`), doctorRecord);
  }, [user, profile]);

  useEffect(() => {
    if (!user) return;

    const apptRef = ref(db, "appointments");
    const unsub = onValue(apptRef, (snap) => {
      if (!snap.exists()) {
        setAppointments([]);
        return;
      }

      const rows = Object.entries(snap.val()).map(([id, val]) => ({ id, ...val }));
      rows.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      setAppointments(rows);
    });

    return () => unsub();
  }, [user]);

  const userAppointments = useMemo(() => {
    if (!user) return [];
    return appointments.filter((appt) => appt.userUid === user.uid);
  }, [appointments, user]);

  const doctorAppointments = useMemo(() => {
    if (!user) return [];
    return appointments.filter((appt) => appt.doctorId === user.uid);
  }, [appointments, user]);

  async function handleCreateProfile(newUser, payload) {
    const role = payload?.role === "doctor" ? "doctor" : "user";
    const baseProfile = {
      uid: newUser.uid,
      email: newUser.email || "",
      name: payload?.name || (newUser.email ? newUser.email.split("@")[0] : "User"),
      role,
      specialization: role === "doctor" ? payload?.specialization || "General Physician" : "",
      hospital: role === "doctor" ? payload?.hospital || "e-Nose Health" : "",
      createdAt: Date.now(),
    };

    await set(ref(db, `userProfiles/${newUser.uid}`), baseProfile);
    await set(ref(db, `accounts/${role === "doctor" ? "doctors" : "users"}/${newUser.uid}`), baseProfile);
    await upsertCredentialRecord(newUser, baseProfile);

    if (role === "doctor") {
      const doctorRecord = {
        id: newUser.uid,
        doctorUid: newUser.uid,
        name: baseProfile.name,
        specialization: baseProfile.specialization,
        hospital: baseProfile.hospital,
        experience: "5 years",
        rating: 4.8,
        isDemo: false,
        email: newUser.email || "",
        createdAt: Date.now(),
      };
      await set(ref(db, `doctorDirectory/${newUser.uid}`), doctorRecord);
    }
  }

  async function validateRole(loginUser, selectedRole) {
    const snap = await get(ref(db, `userProfiles/${loginUser.uid}`));

    if (!snap.exists()) {
      await handleCreateProfile(loginUser, { role: selectedRole });
      return;
    }

    const existing = snap.val();
    if (selectedRole && existing.role !== selectedRole) {
      throw new Error(`This account is registered as ${existing.role}. Please choose ${existing.role} login.`);
    }

    await upsertCredentialRecord(loginUser, existing);
  }

  async function handleBookDoctor({ doctorId, symptoms }) {
    if (!user || !profile || profile.role !== "user") return;

    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor) throw new Error("Doctor not found.");

    const bookingRef = push(ref(db, "appointments"));
    await set(bookingRef, {
      userUid: user.uid,
      userName: profile.name || "Patient",
      userEmail: user.email || "",
      doctorId: doctor.id,
      doctorUid: doctor.doctorUid || null,
      doctorName: doctor.name,
      specialization: doctor.specialization || "General Physician",
      symptoms: symptoms || "",
      status: "Booked",
      prescriptionText: "",
      prescribedAt: null,
      createdAt: Date.now(),
    });
  }

  async function handleSavePrescription({ appointmentId, prescriptionText, status }) {
    if (!user || profile?.role !== "doctor") return;

    await update(ref(db, `appointments/${appointmentId}`), {
      prescriptionText: prescriptionText || "",
      status: status || "Prescription Added",
      prescribedAt: Date.now(),
      doctorUid: user.uid,
      doctorEmail: user.email || "",
    });
  }

  // RTDB live read
  useEffect(() => {
    const r = ref(db, LIVE_PATH);

    const unsub = onValue(
      r,
      (snap) => {
        setRtdbError(null);
        if (!snap.exists()) return;

        const d = snap.val();

        // NOTE: your DB has Gas/Sound in PascalCase and raw in snake_case
        const mapped = {
          gas: Number(d.Gas ?? 0),
          sound: Number(d.Sound ?? 0),
          gas_raw: Number(d.gas_raw ?? 0),
          sound_raw: Number(d.sound_raw ?? 0),
          temperature: Number(d.temperature ?? -1),
          humidity: Number(d.humidity ?? -1),
          timestamp_ms: Number(d.timestamp_ms ?? 0),
        };

        setLive(mapped);

        // add to chart series (use raw too)
        const tlabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setSeries((prev) => {
          const next = [...prev, { t: tlabel, ...mapped }];
          if (next.length > maxPoints) next.shift();
          return next;
        });
      },
      (error) => {
        console.error("RTDB onValue ERROR:", error?.code, error?.message, error);
        setRtdbError({ code: error?.code || "UNKNOWN", message: error?.message || String(error) });
      }
    );

    return () => unsub();
  }, []);

  // update duration counters every 1 second based on RAW thresholds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      if (!lastTickRef.current) {
        lastTickRef.current = now;
        return;
      }
      const dtSec = Math.max(1, Math.round((now - lastTickRef.current) / 1000));
      lastTickRef.current = now;

      const gasRaw = Number(live.gas_raw ?? 0);
      const soundRaw = Number(live.sound_raw ?? 0);

      const asthmaCond = gasRaw >= thresholds.asthma.gasRawHigh && soundRaw >= thresholds.asthma.soundRawHigh;
      const wheezeCond = soundRaw >= thresholds.wheeze.soundRawHigh;
      const tbCond = gasRaw >= thresholds.tb.gasRawHigh && soundRaw >= thresholds.tb.soundRawHigh;

      setCounters((p) => ({
        asthmaSec: asthmaCond ? p.asthmaSec + dtSec : 0,
        wheezeSec: wheezeCond ? p.wheezeSec + dtSec : 0,
        tbSec: tbCond ? p.tbSec + dtSec : 0,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [live.gas_raw, live.sound_raw, thresholds]);

  // compute risks + overall prediction
  const prediction = useMemo(() => {
    return computeDiseaseRisks(live, counters, thresholds);
  }, [live, counters, thresholds]);

  const suggestions = useMemo(
    () => getSuggestions({ prediction, live, counters, thresholds }),
    [prediction, live, counters, thresholds]
  );

  // popup: if ANY disease risk >= alertSeverity (not only label)
  useEffect(() => {
    const alertThr = thresholds?.alertSeverity ?? 70;
    const maxRisk = Math.max(prediction.risks.asthma, prediction.risks.wheeze, prediction.risks.tb);

    const shouldAlert = maxRisk >= alertThr && prediction.label !== "Normal";

    if (shouldAlert && !alertOnceLock) {
      const timer = setTimeout(() => {
        setAlertOpen(true);
        setAlertOnceLock(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    if (!shouldAlert && alertOnceLock) {
      const timer = setTimeout(() => {
        setAlertOnceLock(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [prediction, thresholds, alertOnceLock]);

  // save history
  useEffect(() => {
    if (!user || profile?.role !== "user") return;

    const interval = setInterval(async () => {
      try {
        const payload = {
          ts: Date.now(),
          live,
          prediction,
          suggestions,
        };

        const p = push(ref(db, `patients/${user.uid}/history`));
        await set(p, payload);

        setSavedCount((c) => c + 1);
        setLastSavedAt(payload.ts);
      } catch (e) {
        console.error("History save ERROR:", e?.code, e?.message, e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, profile?.role, live, prediction, suggestions]);

  // helper pills
  const asthmaPill = severityColor(prediction.risks.asthma);
  const wheezePill = severityColor(prediction.risks.wheeze);
  const tbPill = severityColor(prediction.risks.tb);

  const sideNav = [
    "Dashboard",
    "Live Sensors",
    "Predictions",
    "Thresholds",
    "Alerts",
    "Analytics",
    "Settings",
  ];

  const isDoctor = profile?.role === "doctor";
  const dashboardTitle = isDoctor ? "Doctor Dashboard" : "User Dashboard";
  const dashboardSubtitle = isDoctor
    ? "Monitor and manage patient health records with AI-powered insights"
    : "Track your health vitals, predictions, and care updates in realtime";
  const doctorPrescribedCount = doctorAppointments.filter((appt) => (appt.prescriptionText || "").trim().length > 0).length;
  const bookedPatientsFeed = appointments.length
    ? appointments.slice(0, 5).map((appt) => ({
        id: appt.id,
        name: appt.userName || "Patient",
        condition: appt.symptoms || "General Checkup",
        status: appt.status || "Booked",
      }))
    : FAKE_PATIENTS;
  const doctorsFeed = (doctors.length ? doctors : FAKE_DOCTORS)
    .slice()
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const newDoctorsFeed = doctorsFeed.filter((d) => !d.isDemo).slice(0, 5);
  const doctorDirectoryFeed = (newDoctorsFeed.length ? newDoctorsFeed : doctorsFeed).slice(0, 5);

  if (!user) {
    return (
      <div className="authGate">
        <div className="authGateCard">
          <div className="authGateTitle">e-Nose Health Portal</div>
          <div className="authGateSub">
            Login or create an account. Choose <b>User</b> or <b>Doctor</b> to continue.
          </div>

          <AuthPanel
            user={user}
            profile={profile}
            onCreateProfile={handleCreateProfile}
            onValidateRole={validateRole}
          />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="authGate">
        <div className="authGateCard">
          <div className="authGateTitle">Loading profile...</div>
          <div className="authGateSub">Please wait while we prepare your dashboard.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="appShell">
      <aside className="sideBar">
        <div className="brandRow">
          <div className="brandIcon">eN</div>
          <div>
            <div className="brandTitle">e-Nose</div>
            <div className="brandSub">Health Monitor</div>
          </div>
        </div>

        <div className="sideSectionTitle">Main Menu</div>
        <nav className="sideNav">
          {sideNav.map((item, idx) => (
            <button key={item} className={idx === 0 ? "sideLink active" : "sideLink"}>
              <span className="dot" />
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="mainContent">
        <div className="container">
          <HeaderBar
            title={dashboardTitle}
            subtitle={dashboardSubtitle}
          />

          {rtdbError ? (
            <div className="panel" style={{ border: "1px solid rgba(255,80,80,0.35)" }}>
              <div className="panelHead">
                <div className="panelTitle">Firebase RTDB Error</div>
              </div>
              <div className="smallText" style={{ color: "#ffb3b3" }}>
                <b>Code:</b> {rtdbError.code} <br />
                <b>Message:</b> {rtdbError.message}
              </div>
            </div>
          ) : null}

          <div className="topRow">
            <AuthPanel
              user={user}
              profile={profile}
              onCreateProfile={handleCreateProfile}
              onValidateRole={validateRole}
            />
            {isDoctor ? (
              <div className="panel">
                <div className="panelHead">
                  <div className="panelTitle">Doctor Summary</div>
                </div>
                <div className="gridCards">
                  <div className="card">
                    <div className="cardLabel">Total Patients</div>
                    <div className="cardValue">{doctorAppointments.length}</div>
                  </div>
                  <div className="card">
                    <div className="cardLabel">Prescriptions Added</div>
                    <div className="cardValue">{doctorPrescribedCount}</div>
                  </div>
                </div>
              </div>
            ) : (
              <HealthStatus prediction={prediction} />
            )}
          </div>

          <CarePortal
            user={user}
            profile={profile}
            doctors={doctors}
            userAppointments={userAppointments}
            doctorAppointments={doctorAppointments}
            onBookDoctor={handleBookDoctor}
            onSavePrescription={handleSavePrescription}
          />

          <div className="panel">
            <div className="panelHead">
              <div className="panelTitle">Dashboard Highlights</div>
            </div>
            <div className="suggestGrid">
              <div className="suggestItem">
                <div className="thTitle">Booked Patients</div>
                {bookedPatientsFeed.map((patient) => (
                  <div key={patient.id} className="smallText">
                    {patient.name} • {patient.condition} • {patient.status}
                  </div>
                ))}
              </div>

              <div className="suggestItem">
                <div className="thTitle">Doctors Directory</div>
                {doctorDirectoryFeed.map((doctor) => (
                  <div key={doctor.id} className="smallText">
                    {doctor.name} • {doctor.specialization || "General Physician"} • {doctor.isDemo ? "Demo" : "Live"}
                  </div>
                ))}
              </div>

              <div className="suggestItem">
                <div className="thTitle">Newly Created Doctors</div>
                {(newDoctorsFeed.length ? newDoctorsFeed : [{ id: "demo-new", name: "No live doctor yet", specialization: "Create a doctor account", isDemo: true }]).map((doctor) => (
                  <div key={doctor.id} className="smallText">
                    {doctor.name} • {doctor.specialization} • {doctor.isDemo ? "Demo" : "New"}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {!isDoctor ? (
            <>
              <LiveCards live={live} />

              <div className="gridCards" style={{ marginTop: 10 }}>
                <div className="card">
                  <div className="cardLabel">Asthma Risk</div>
                  <div className="cardValue">{Math.round(prediction.risks.asthma)} <span className="unit">/100</span></div>
                  <div className={`statusPill ${asthmaPill}`} style={{ marginTop: 8 }}>{asthmaPill.toUpperCase()}</div>
                  <div className="smallText" style={{ marginTop: 6 }}>Duration: {counters.asthmaSec}s</div>
                </div>

                <div className="card">
                  <div className="cardLabel">Wheezing Risk</div>
                  <div className="cardValue">{Math.round(prediction.risks.wheeze)} <span className="unit">/100</span></div>
                  <div className={`statusPill ${wheezePill}`} style={{ marginTop: 8 }}>{wheezePill.toUpperCase()}</div>
                  <div className="smallText" style={{ marginTop: 6 }}>Duration: {counters.wheezeSec}s</div>
                </div>

                <div className="card">
                  <div className="cardLabel">TB Risk</div>
                  <div className="cardValue">{Math.round(prediction.risks.tb)} <span className="unit">/100</span></div>
                  <div className={`statusPill ${tbPill}`} style={{ marginTop: 8 }}>{tbPill.toUpperCase()}</div>
                  <div className="smallText" style={{ marginTop: 6 }}>Duration: {counters.tbSec}s</div>
                </div>
              </div>

              <SensorCharts series={series} />

              <div className="split">
                <ThresholdPanel user={user} thresholds={thresholds} setThresholds={setThresholds} />
                <AnalyticsPanel lastSavedAt={lastSavedAt} savedCount={savedCount} />
              </div>

              <div className="panel">
                <div className="panelHead">
                  <div className="panelTitle">Realtime Prediction Insights</div>
                </div>
                <div className="suggestGrid">
                  {suggestions.map((s, i) => (
                    <div key={i} className="suggestItem">{s}</div>
                  ))}
                </div>
              </div>

              <AlertsModal
                open={alertOpen}
                onClose={() => setAlertOpen(false)}
                prediction={prediction}
                suggestions={suggestions}
              />
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
