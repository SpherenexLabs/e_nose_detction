import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Hard fail in production if missing (prevents blank page confusion)
function assertEnv(key, value) {
  if (!value) {
    throw new Error(
      `Missing ${key}. Add it to .env (local) and Vercel Environment Variables.`
    );
  }
}

assertEnv("VITE_FIREBASE_API_KEY", firebaseConfig.apiKey);
assertEnv("VITE_FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain);
assertEnv("VITE_FIREBASE_DATABASE_URL", firebaseConfig.databaseURL);
assertEnv("VITE_FIREBASE_PROJECT_ID", firebaseConfig.projectId);
assertEnv("VITE_FIREBASE_APP_ID", firebaseConfig.appId);

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);