import React, { useMemo, useState } from "react";

const DEMO_DOCTOR_BOOKINGS = [
  {
    id: "demo-appt-doc-1",
    userName: "John Doe",
    userEmail: "john.demo@example.com",
    symptoms: "Frequent wheeze at night",
    status: "Booked",
    prescriptionText: "Use inhaler twice daily for 5 days.",
    prediction: {
      label: "Wheezing",
      severity: 62,
      confidence: 0.78,
      risks: {
        asthma: 55,
        wheeze: 72,
        tb: 25,
      },
    },
  },
  {
    id: "demo-appt-doc-2",
    userName: "Jane Smith",
    userEmail: "jane.demo@example.com",
    symptoms: "Persistent cough for 1 week",
    status: "Booked",
    prescriptionText: "Steam inhalation and chest X-ray follow-up.",
    prediction: {
      label: "Suspected TB",
      severity: 68,
      confidence: 0.72,
      risks: {
        asthma: 40,
        wheeze: 45,
        tb: 78,
      },
    },
  },
];

const DEMO_USER_BOOKINGS = [
  {
    id: "demo-appt-user-1",
    doctorName: "Dr. Meera Nair",
    specialization: "Pulmonologist",
    symptoms: "Shortness of breath",
    status: "Booked",
    prescriptionText: "Pending",
    prediction: {
      label: "Asthma",
      severity: 55,
      confidence: 0.71,
      risks: {
        asthma: 65,
        wheeze: 42,
        tb: 28,
      },
    },
  },
  {
    id: "demo-appt-user-2",
    doctorName: "Dr. Arjun Patel",
    specialization: "Respiratory Specialist",
    symptoms: "Dry cough",
    status: "Consulted",
    prescriptionText: "Hydration and breathing exercise for 7 days.",
    prediction: {
      label: "Normal",
      severity: 18,
      confidence: 0.85,
      risks: {
        asthma: 15,
        wheeze: 20,
        tb: 12,
      },
    },
  },
];

export default function CarePortal({
  user,
  profile,
  doctors,
  userAppointments,
  doctorAppointments,
  onBookDoctor,
  onSavePrescription,
  onUpdateAppointmentStatus,
}) {
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [bookingMsg, setBookingMsg] = useState("");
  const [bookingErr, setBookingErr] = useState("");
  const [prescriptionDrafts, setPrescriptionDrafts] = useState({});
  const [openPrescriptions, setOpenPrescriptions] = useState({});

  const doctorList = useMemo(() => {
    return Array.isArray(doctors) ? doctors : [];
  }, [doctors]);
  const doctorBookingsToShow = doctorAppointments.length ? doctorAppointments : DEMO_DOCTOR_BOOKINGS;
  const userBookingsToShow = userAppointments.length ? userAppointments : DEMO_USER_BOOKINGS;

  async function handleBookSubmit(e) {
    e.preventDefault();
    setBookingMsg("");
    setBookingErr("");

    if (!selectedDoctorId) {
      setBookingErr("Please choose a doctor.");
      return;
    }

    try {
      await onBookDoctor?.({ doctorId: selectedDoctorId, symptoms });
      setSymptoms("");
      setBookingMsg("Doctor booked successfully.");
    } catch (err) {
      setBookingErr(err?.message || "Failed to book doctor.");
    }
  }

  async function submitPrescription(appt) {
    const text = prescriptionDrafts[appt.id] ?? appt.prescriptionText ?? "";
    await onSavePrescription?.({
      appointmentId: appt.id,
      prescriptionText: text,
      status: text ? "Prescription Added" : "Consulted",
    });
  }

  async function handleAcceptPatient(appt) {
    await onUpdateAppointmentStatus?.({
      appointmentId: appt.id,
      status: "Accepted",
    });
  }

  async function handleRejectPatient(appt) {
    await onUpdateAppointmentStatus?.({
      appointmentId: appt.id,
      status: "Rejected",
    });
  }

  function togglePrescription(apptId) {
    setOpenPrescriptions((prev) => ({
      ...prev,
      [apptId]: !prev[apptId],
    }));
  }

  if (!user) {
    return (
      <div className="panel">
        <div className="panelHead">
          <div className="panelTitle">Care Portal</div>
        </div>
        <div className="smallText">Login as User or Doctor to access booking and prescription workflows.</div>
      </div>
    );
  }

  if (profile?.role === "doctor") {
    return (
      <div className="panel">
        <div className="panelHead">
          <div className="panelTitle">Doctor Workspace</div>
          <div className="badge">Doctor Login</div>
        </div>

        <div className="smallText">Review patient bookings, health conditions, and add prescriptions directly from this page.</div>

        <div className="appointmentList">
          {doctorBookingsToShow.map((appt) => {
            const isRejected = appt.status === "Rejected";
            const isAccepted = appt.status === "Accepted";
            return (
              <div key={appt.id} className="appointmentCard" style={isRejected ? { opacity: 0.6 } : {}}>
                <div className="appointmentHead">
                  <div>
                    <div className="appointmentTitle">{appt.userName || "Patient"}</div>
                    <div className="smallText">{appt.userEmail || "-"}</div>
                  </div>
                  <div className={`statusPill ${isRejected ? "red" : isAccepted ? "green" : "yellow"}`}>
                    {appt.status || "Booked"}
                  </div>
                </div>

                <div className="smallText" style={{ marginTop: 8 }}>
                  <strong>Symptoms:</strong> {appt.symptoms || "Not provided"}
                </div>

                {/* Disease/Health Status */}
                {appt.prediction && (
                  <div style={{ marginTop: 10, padding: "8px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                    <div className="smallText" style={{ marginBottom: 6 }}>
                      <strong>Health Status:</strong>
                    </div>
                    <div className="smallText">
                      • <strong>Condition:</strong> {appt.prediction.label || "Normal"}
                    </div>
                    <div className="smallText">
                      • <strong>Severity:</strong> {Math.round(appt.prediction.severity || 0)}/100
                    </div>
                    <div className="smallText">
                      • <strong>Confidence:</strong> {Math.round((appt.prediction.confidence || 0) * 100)}%
                    </div>

                    {/* Disease Risks */}
                    <div style={{ marginTop: 6 }}>
                      <div className="smallText">
                        • <strong>Asthma Risk:</strong> {Math.round(appt.prediction.risks?.asthma || 0)}/100
                      </div>
                      <div className="smallText">
                        • <strong>Wheeze Risk:</strong> {Math.round(appt.prediction.risks?.wheeze || 0)}/100
                      </div>
                      <div className="smallText">
                        • <strong>TB Risk:</strong> {Math.round(appt.prediction.risks?.tb || 0)}/100
                      </div>
                    </div>
                  </div>
                )}

                <textarea
                  className="input prescriptionArea"
                  placeholder="Write prescription here..."
                  value={prescriptionDrafts[appt.id] ?? appt.prescriptionText ?? ""}
                  onChange={(e) =>
                    setPrescriptionDrafts((prev) => ({
                      ...prev,
                      [appt.id]: e.target.value,
                    }))
                  }
                  disabled={isRejected}
                />

                <div className="appointmentActions" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {!isRejected && !isAccepted && (
                    <>
                      <button className="btnSmall" style={{ backgroundColor: "#4CAF50", color: "white" }} onClick={() => handleAcceptPatient(appt)}>
                        Accept Patient
                      </button>
                      <button className="btnSmall" style={{ backgroundColor: "#f44336", color: "white" }} onClick={() => handleRejectPatient(appt)}>
                        Reject Patient
                      </button>
                    </>
                  )}
                  <button className="btnSmall" onClick={() => submitPrescription(appt)} disabled={isRejected}>
                    Save Prescription
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panelHead">
        <div className="panelTitle">Patient Booking</div>
        <div className="badge">User Login</div>
      </div>

      <div className="doctorGrid">
        {doctorList.map((doc) => (
          <div key={doc.id} className="doctorCard">
            <div className="doctorTop">
              <div>
                <div className="doctorName">{doc.name}</div>
                <div className="smallText">{doc.specialization}</div>
              </div>
              {doc.isDemo ? <div className="miniPill yellow">Demo</div> : <div className="miniPill green">Live</div>}
            </div>
            <div className="smallText">Hospital: {doc.hospital || "e-Nose Health"}</div>
            <div className="smallText">Experience: {doc.experience || "5 years"}</div>
            <div className="smallText">Rating: {Number(doc.rating || 4.6).toFixed(1)}/5</div>
            <button className="btnSmall" style={{ marginTop: 10 }} onClick={() => setSelectedDoctorId(doc.id)}>
              Choose Doctor
            </button>
          </div>
        ))}
      </div>

      <form className="bookingForm" onSubmit={handleBookSubmit}>
        <div className="thRow">Selected Doctor</div>
        <select className="input" value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)}>
          <option value="">Select doctor</option>
          {doctorList.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name} • {doc.specialization}
            </option>
          ))}
        </select>

        <textarea
          className="input prescriptionArea"
          placeholder="Enter symptoms or notes"
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
        />

        {bookingErr ? <div className="error">{bookingErr}</div> : null}
        {bookingMsg ? <div className="smallText">{bookingMsg}</div> : null}

        <button className="btn" type="submit">Book Doctor</button>
      </form>

      <div className="panelHead" style={{ marginTop: 14 }}>
        <div className="panelTitle">My Appointments</div>
      </div>

      <div className="appointmentList">
        {userBookingsToShow.map((appt) => {
          const isRejected = appt.status === "Rejected";
          const hasHealthData = appt.prediction || appt.healthData;
          const healthLabel = appt.prediction?.label || appt.healthData?.condition || "No Data";
          const healthSeverity = appt.prediction?.severity || appt.healthData?.severity || 0;
          const healthConfidence = appt.prediction?.confidence || appt.healthData?.confidence || 0;
          const asthmaRisk = appt.prediction?.risks?.asthma || appt.healthData?.asthmaRisk || 0;
          const wheezeRisk = appt.prediction?.risks?.wheeze || appt.healthData?.wheezeRisk || 0;
          const tbRisk = appt.prediction?.risks?.tb || appt.healthData?.tbRisk || 0;
          
          return (
            <div key={appt.id} className="appointmentCard" style={isRejected ? { opacity: 0.6, borderColor: "#f44336" } : {}}>
              <div className="appointmentHead">
                <div className="appointmentTitle">{appt.doctorName || "Doctor"}</div>
                <div className={`statusPill ${isRejected ? "red" : appt.status === "Accepted" ? "green" : "yellow"}`}>
                  {appt.status || "Booked"}
                </div>
              </div>
              <div className="smallText">Specialization: {appt.specialization || "-"}</div>
              <div className="smallText">Symptoms: {appt.symptoms || "-"}</div>

              {/* Your Health Status - Always Show */}
              <div style={{ marginTop: 10, padding: "8px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                <div className="smallText" style={{ marginBottom: 6 }}>
                  <strong>Your Health Status:</strong>
                </div>
                <div className="smallText">
                  • <strong>Condition:</strong> {healthLabel}
                </div>
                <div className="smallText">
                  • <strong>Severity:</strong> {Math.round(healthSeverity)}/100
                </div>
                <div className="smallText">
                  • <strong>Confidence:</strong> {Math.round(healthConfidence * 100)}%
                </div>

                {/* Disease Risks */}
                {hasHealthData && (
                  <div style={{ marginTop: 6 }}>
                    <div className="smallText">
                      • <strong>Asthma Risk:</strong> {Math.round(asthmaRisk)}/100
                    </div>
                    <div className="smallText">
                      • <strong>Wheeze Risk:</strong> {Math.round(wheezeRisk)}/100
                    </div>
                    <div className="smallText">
                      • <strong>TB Risk:</strong> {Math.round(tbRisk)}/100
                    </div>
                  </div>
                )}
              </div>

              <div className="appointmentActions">
                <button className="btnSmall" type="button" onClick={() => togglePrescription(appt.id)}>
                  {openPrescriptions[appt.id] ? "Hide Prescription" : "Open Prescription"}
                </button>
              </div>

              {openPrescriptions[appt.id] ? (
                <textarea
                  className="input prescriptionArea"
                  readOnly
                  value={appt.prescriptionText || "Pending"}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
