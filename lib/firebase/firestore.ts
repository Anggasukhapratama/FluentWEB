import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./client";
import { Session, SessionQuestion, LeaderboardEntry } from "@/types";

// Save a completed session
export async function saveSession(
  userId: string,
  session: Omit<Session, "id" | "createdAt">
): Promise<string> {
  const sessionRef = await addDoc(
    collection(db, "users", userId, "sessions"),
    { ...session, createdAt: serverTimestamp() }
  );

  // Save each question
  for (const q of session.questions || []) {
    await addDoc(
      collection(db, "users", userId, "sessions", sessionRef.id, "questions"),
      { ...q, createdAt: serverTimestamp() }
    );
  }

  // Update total points in profile
  await updateDoc(doc(db, "users", userId), {
    totalPoints: increment(session.pointsEarned),
  });

  // Update leaderboard
  await updateDoc(doc(db, "leaderboard", "global", "users", userId), {
    totalPoints: increment(session.pointsEarned),
  });

  return sessionRef.id;
}

// Get all sessions for a user
export async function getUserSessions(userId: string): Promise<Session[]> {
  const q = query(
    collection(db, "users", userId, "sessions"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Session));
}

// Get single session with questions
export async function getSessionWithQuestions(
  userId: string,
  sessionId: string
): Promise<{ session: Session; questions: SessionQuestion[] } | null> {
  const sessionSnap = await getDoc(
    doc(db, "users", userId, "sessions", sessionId)
  );
  if (!sessionSnap.exists()) return null;

  const questionsSnap = await getDocs(
    query(
      collection(db, "users", userId, "sessions", sessionId, "questions"),
      orderBy("questionNumber", "asc")
    )
  );

  return {
    session: { id: sessionSnap.id, ...sessionSnap.data() } as Session,
    questions: questionsSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as SessionQuestion)
    ),
  };
}

// Get global leaderboard
export async function getLeaderboard(
  limitCount = 50
): Promise<(LeaderboardEntry & { rank: number })[]> {
  const q = query(
    collection(db, "leaderboard", "global", "users"),
    orderBy("totalPoints", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({
    id: d.id,
    rank: i + 1,
    ...d.data(),
  } as LeaderboardEntry & { rank: number }));
}

// Get leaderboard filtered by job type
export async function getLeaderboardByJob(
  jobType: string,
  limitCount = 50
): Promise<(LeaderboardEntry & { rank: number })[]> {
  const q = query(
    collection(db, "leaderboard", "global", "users"),
    where("jobType", "==", jobType),
    orderBy("totalPoints", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({
    id: d.id,
    rank: i + 1,
    ...d.data(),
  } as LeaderboardEntry & { rank: number }));
}

// Update streak
export async function updateStreak(userId: string): Promise<number> {
  const profileSnap = await getDoc(doc(db, "users", userId));
  if (!profileSnap.exists()) return 0;

  const data = profileSnap.data();
  const lastDate = data.lastSessionDate?.toDate?.();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let newStreak = 1;
  if (lastDate) {
    const last = new Date(lastDate);
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      newStreak = (data.streakDays || 0) + 1;
    } else if (diffDays === 0) {
      newStreak = data.streakDays || 1;
    }
  }

  await updateDoc(doc(db, "users", userId), {
    streakDays: newStreak,
    lastSessionDate: serverTimestamp(),
  });

  return newStreak;
}
