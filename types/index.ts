export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  gender: "male" | "female";
  jobType: string;
  photoURL: string;
  totalPoints: number;
  streakDays: number;
  lastSessionDate: Date | null;
  createdAt: Date;
}

export interface Session {
  id: string;
  jobPosition: string;
  difficulty: "easy" | "medium" | "hard";
  language: "id" | "en";
  overallScore: number;
  pointsEarned: number;
  avgWPM: number;
  avgEyeContact: number;
  avgFluency: number;
  totalFillerCount: number;
  questions?: SessionQuestion[];
  createdAt: Date;
}

export interface SessionQuestion {
  id?: string;
  questionNumber: number;
  questionText: string;
  transcript: string;
  wpm: number;
  fluencyScore: number;
  fillerWords: Record<string, number>;
  eyeContactPercent: number;
  headStabilityPercent: number;
  genuineSmileCount: number;
  fakeSmileCount: number;
  aiFeedback?: AIFeedback;
  createdAt?: Date;
}

export interface AIFeedback {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  idealAnswer: string;
}

export interface SpeechMetrics {
  transcript: string;
  wpm: number;
  fluencyScore: number;
  fillerWords: Record<string, number>;
  totalFillerCount: number;
}

export interface FaceMetrics {
  eyeContactPercent: number;
  headStabilityPercent: number;
  genuineSmileCount: number;
  fakeSmileCount: number;
  smileHistory: SmileEvent[];
}

export interface SmileEvent {
  type: "genuine" | "fake";
  onsetDuration: number;
  apexDuration: number;
  offsetDuration: number;
  timestamp: number;
}

export interface LeaderboardEntry {
  id: string;
  fullName: string;
  jobType: string;
  totalPoints: number;
  photoURL?: string;
  rank: number;
}

export interface InterviewSession {
  jobPosition: string;
  difficulty: "easy" | "medium" | "hard";
  language: "id" | "en";
  questions: string[];
  currentQuestion: number;
  answers: SessionQuestion[];
  isComplete: boolean;
}

export type Difficulty = "easy" | "medium" | "hard";
export type Language = "id" | "en";

export const JOB_TYPES = [
  "Software Developer",
  "Data Scientist",
  "UI/UX Designer",
  "Product Manager",
  "Marketing",
  "Sales",
  "Finance",
  "HR / Recruiter",
  "Konsultan",
  "Guru / Dosen",
  "Dokter / Kesehatan",
  "Hukum / Legal",
  "Lainnya",
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export const FILLER_WORDS_ID = [
  "um", "uh", "er", "eh", "jadi", "gitu", "ya", "kan", "tuh", "nih",
  "emm", "hmm", "apa", "gimana", "maksudnya",
];

export const FILLER_WORDS_EN = [
  "um", "uh", "er", "like", "you know", "basically", "literally",
  "actually", "honestly", "right", "so", "well",
];
