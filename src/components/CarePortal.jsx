import React, { useMemo, useState } from "react";

const DEMO_DOCTOR_BOOKINGS = [
  {
    id: "demo-appt-doc-1",
    userName: "John Doe",
    userEmail: "john.demo@example.com",
    symptoms: "Frequent wheeze at night",
    status: "Booked",
    prescriptionText: "Use inhaler twice daily for 5 days.",
  },
  {
    id: "demo-appt-doc-2",
    userName: "Jane Smith",
    userEmail: "jane.demo@example.com",
    symptoms: "Persistent cough for 1 week",
    status: "Prescription Added",
    prescriptionText: "Steam inhalation and chest X-ray follow-up.",
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
  },
  {
    id: "demo-appt-user-2",
    doctorName: "Dr. Arjun Patel",
    specialization: "Respiratory Specialist",
    symptoms: "Dry cough",
    status: "Consulted",
    prescriptionText: "Hydration and breathing exercise for 7 days.",
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

        <div className="smallText">Review patient bookings and add prescriptions directly from this page.</div>

        <div className="appointmentList">
          {doctorBookingsToShow.map((appt) => (
              <div key={appt.id} className="appointmentCard">
                <div className="appointmentHead">
                  <div>
                    <div className="appointmentTitle">{appt.userName || "Patient"}</div>
                    <div className="smallText">{appt.userEmail || "-"}</div>
                  </div>
                  <div className="statusPill yellow">{appt.status || "Booked"}</div>
                </div>

                <div className="smallText" style={{ marginTop: 8 }}>
                  Symptoms: {appt.symptoms || "Not provided"}
                </div>

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
                />

                <div className="appointmentActions">
                  <button className="btnSmall" onClick={() => submitPrescription(appt)}>
                    Save Prescription
                  </button>
                </div>
              </div>
            ))}
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
        {userBookingsToShow.map((appt) => (
            <div key={appt.id} className="appointmentCard">
              <div className="appointmentHead">
                <div className="appointmentTitle">{appt.doctorName || "Doctor"}</div>
                <div className="statusPill green">{appt.status || "Booked"}</div>
              </div>
              <div className="smallText">Specialization: {appt.specialization || "-"}</div>
              <div className="smallText">Symptoms: {appt.symptoms || "-"}</div>
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
          ))}
      </div>
    </div>
  );
}
