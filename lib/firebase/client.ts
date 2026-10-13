import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// Initialize Firebase (singleton pattern, client-side only)
const app =
  typeof window !== "undefined" || process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    ? getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApp()
    : getApps()[0] ?? initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
