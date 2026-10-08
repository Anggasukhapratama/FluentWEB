import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./client";
import { UserProfile } from "@/types";

// Register new user
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  gender: "male" | "female",
  jobType: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update display name
  await updateProfile(user, { displayName: fullName });

  // Create profile in Firestore
  await setDoc(doc(db, "users", user.uid), {
    fullName,
    email,
    gender,
    jobType,
    photoURL: "",
    totalPoints: 0,
    streakDays: 0,
    lastSessionDate: null,
    createdAt: serverTimestamp(),
  });

  // Initialize leaderboard entry
  await setDoc(doc(db, "leaderboard", "global", "users", user.uid), {
    fullName,
    jobType,
    totalPoints: 0,
    createdAt: serverTimestamp(),
  });

  return user;
}

// Login
export async function loginUser(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Logout
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Reset password
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// Get user profile
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: uid, ...docSnap.data() } as UserProfile;
  }
  return null;
}

// Update user profile
export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
}
