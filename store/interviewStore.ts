import { create } from "zustand";
import { InterviewSession, SessionQuestion, FaceMetrics, SpeechMetrics } from "@/types";

interface InterviewStore {
  // Session config
  jobPosition: string;
  difficulty: "easy" | "medium" | "hard";
  language: "id" | "en";

  // Questions
  questions: string[];
  currentQuestionIndex: number;

  // Per-question data
  answers: SessionQuestion[];
  currentTranscript: string;
  currentFaceMetrics: FaceMetrics | null;
  currentSpeechMetrics: SpeechMetrics | null;

  // Session state
  isSessionActive: boolean;
  isComplete: boolean;
  sessionId: string | null;

  // Actions
  setSetup: (job: string, difficulty: "easy" | "medium" | "hard", language: "id" | "en") => void;
  setQuestions: (questions: string[]) => void;
  nextQuestion: () => void;
  setCurrentTranscript: (transcript: string) => void;
  setCurrentFaceMetrics: (metrics: FaceMetrics) => void;
  setCurrentSpeechMetrics: (metrics: SpeechMetrics) => void;
  saveCurrentAnswer: (answer: SessionQuestion) => void;
  setSessionActive: (active: boolean) => void;
  completeSession: (sessionId: string) => void;
  resetSession: () => void;
}

const initialState = {
  jobPosition: "",
  difficulty: "medium" as const,
  language: "id" as const,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  currentTranscript: "",
  currentFaceMetrics: null,
  currentSpeechMetrics: null,
  isSessionActive: false,
  isComplete: false,
  sessionId: null,
};

export const useInterviewStore = create<InterviewStore>((set) => ({
  ...initialState,

  setSetup: (jobPosition, difficulty, language) =>
    set({ jobPosition, difficulty, language }),

  setQuestions: (questions) =>
    set({ questions, currentQuestionIndex: 0, answers: [], isSessionActive: true }),

  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: state.currentQuestionIndex + 1,
      currentTranscript: "",
      currentFaceMetrics: null,
      currentSpeechMetrics: null,
    })),

  setCurrentTranscript: (transcript) => set({ currentTranscript: transcript }),

  setCurrentFaceMetrics: (metrics) => set({ currentFaceMetrics: metrics }),

  setCurrentSpeechMetrics: (metrics) => set({ currentSpeechMetrics: metrics }),

  saveCurrentAnswer: (answer) =>
    set((state) => ({
      answers: [...state.answers, answer],
    })),

  setSessionActive: (active) => set({ isSessionActive: active }),

  completeSession: (sessionId) =>
    set({ isComplete: true, isSessionActive: false, sessionId }),

  resetSession: () => set(initialState),
}));
