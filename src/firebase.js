import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Read values from Vite env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // optional
};

// Validate env (fail early)
const required = ["apiKey", "authDomain", "databaseURL", "projectId", "appId"];
for (const k of required) {
  if (!firebaseConfig[k]) {
    console.error(`Missing Firebase config: ${k}. Check your .env and restart Vite.`);
  }
}

const validDbDomain =
  firebaseConfig.databaseURL?.includes("firebaseio.com") ||
  firebaseConfig.databaseURL?.includes("firebasedatabase.app");

if (firebaseConfig.databaseURL && !validDbDomain) {
  console.error("Firebase databaseURL looks wrong:", firebaseConfig.databaseURL);
}

// Debug (optional)
console.log("Firebase Project:", firebaseConfig.projectId);
console.log("Firebase DB URL:", firebaseConfig.databaseURL);

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
