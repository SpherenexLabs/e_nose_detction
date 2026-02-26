import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

function toFriendlyAuthMessage(error) {
  const code = error?.code || "";

  if (code === "auth/invalid-email") return "Please enter a valid email address.";
  if (code === "auth/user-not-found") return "Account not found. Please create a new account.";
  if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Invalid email or password. Please check your credentials.";
  }
  if (code === "auth/email-already-in-use") {
    return "This email is already registered. Please use Login instead of Sign Up.";
  }
  if (code === "auth/weak-password") return "Password should be at least 6 characters.";
  if (code === "auth/too-many-requests") return "Too many attempts. Please wait and try again.";
  if (code === "auth/network-request-failed") return "Network issue. Check your internet and try again.";
  if (code === "auth/operation-not-allowed") {
    return "Email/Password login is disabled in Firebase. Enable it in Authentication settings.";
  }

  return error?.message || "Authentication failed. Please try again.";
}

export default function AuthPanel({ user, profile, onCreateProfile, onValidateRole }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("user");
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("General Physician");
  const [hospital, setHospital] = useState("e-Nose Health");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        await onValidateRole?.(cred.user, role);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await onCreateProfile?.(cred.user, { role, name, specialization, hospital });
      }
    } catch (e2) {
      if (mode === "login" && auth.currentUser) {
        await signOut(auth);
      }
      setErr(toFriendlyAuthMessage(e2));
    }
  }

  if (user) {
    return (
      <div className="authBox">
        <div className="authRow">
          <div className="smallText">Signed in as</div>
          <div className="mono">{user.email}</div>
          <div className="smallText">Role: {profile?.role || "user"}</div>
          <div className="smallText">Name: {profile?.name || "-"}</div>
        </div>
        <button className="btn" onClick={() => signOut(auth)}>Logout</button>
      </div>
    );
  }

  return (
    <div className="authBox">
      <div className="portalSwitch">
        <button
          type="button"
          className={role === "user" ? "portalCard active" : "portalCard"}
          onClick={() => setRole("user")}
        >
          <div className="portalIcon">👤</div>
          <div className="portalTitle">User Portal</div>
          <div className="portalDesc">Track vitals, predictions, and appointments.</div>
        </button>

        <button
          type="button"
          className={role === "doctor" ? "portalCard active" : "portalCard"}
          onClick={() => setRole("doctor")}
        >
          <div className="portalIcon">🩺</div>
          <div className="portalTitle">Doctor Portal</div>
          <div className="portalDesc">Manage patients and add prescriptions.</div>
        </button>
      </div>

      <div className="authTabs">
        <button className={mode === "login" ? "tab active" : "tab"} onClick={() => setMode("login")}>Login</button>
        <button className={mode === "signup" ? "tab active" : "tab"} onClick={() => setMode("signup")}>Sign Up</button>
      </div>

      <form onSubmit={handleSubmit} className="authForm">
        {mode === "signup" ? (
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required />
        ) : null}

        <input
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          autoComplete="email"
          required
        />
        <input
          className="input"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="Password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={6}
          required
        />

        {mode === "signup" && role === "doctor" ? (
          <>
            <input className="input" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Specialization" />
            <input className="input" value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="Hospital / Clinic" />
          </>
        ) : null}

        {err ? <div className="error">{err}</div> : null}
        <button className="btn" type="submit">
          {mode === "login" ? `${role === "doctor" ? "Doctor" : "User"} Login` : `Create ${role === "doctor" ? "Doctor" : "User"} Account`}
        </button>
      </form>
      <div className="smallText">Credentials are managed by Firebase Auth. Account metadata is stored in Realtime Database under E_Nose_Detect/credentialStore.</div>
    </div>
  );
}
