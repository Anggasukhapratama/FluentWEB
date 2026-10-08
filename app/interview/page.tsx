"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, SkipForward, Clock } from "lucide-react";
import { useInterviewStore } from "@/store/interviewStore";
import { useAuth } from "@/hooks/useAuth";
import {
  calculateWPM,
  detectFillerWords,
  calculateFluencyScore,
  calculateOverallScore,
  calculatePoints,
} from "@/lib/speechAnalysis";
import { EyeContactTracker, HeadStabilityTracker } from "@/lib/gazeDetection";
import { saveSession, updateStreak } from "@/lib/firebase/firestore";
import { SessionQuestion, FaceMetrics, SmileEvent } from "@/types";

const QUESTION_DURATION = 30; // seconds
const TOTAL_QUESTIONS = 5;

export default function InterviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const store = useInterviewStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const faceMeshRef = useRef<any>(null);
  const eyeTrackerRef = useRef(new EyeContactTracker());
  const headTrackerRef = useRef(new HeadStabilityTracker());
  const smileEventsRef = useRef<SmileEvent[]>([]);

  const [timer, setTimer] = useState(QUESTION_DURATION);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [liveWPM, setLiveWPM] = useState(0);
  const [liveEyeContact, setLiveEyeContact] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [faceMeshLoaded, setFaceMeshLoaded] = useState(false);
  const [completing, setCompleting] = useState(false);

  const currentQ = store.currentQuestionIndex;
  const question = store.questions[currentQ];

  // Redirect if no session
  useEffect(() => {
    if (!store.questions.length) router.push("/setup");
  }, [store.questions, router]);

  // Init camera + MediaPipe
  useEffect(() => {
    let animFrame: number;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        await loadFaceMesh();
        setFaceMeshLoaded(true);
        runDetection();
      } catch (e) {
        console.error("Camera error:", e);
      }
    };

    const loadFaceMesh = async () => {
      const { FaceMesh } = await import("@mediapipe/face_mesh");
      const fm = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      fm.onResults((results: any) => {
        if (results.multiFaceLandmarks?.[0]) {
          const landmarks = results.multiFaceLandmarks[0];
          processLandmarks(landmarks);
        }
      });
      faceMeshRef.current = fm;
    };

    const runDetection = async () => {
      if (videoRef.current && faceMeshRef.current && videoRef.current.readyState === 4) {
        await faceMeshRef.current.send({ image: videoRef.current });
      }
      animFrame = requestAnimationFrame(runDetection);
    };

    initCamera();
    return () => {
      cancelAnimationFrame(animFrame);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const processLandmarks = useCallback((landmarks: any[]) => {
    // Import gaze detection inline to avoid SSR issues
    import("@/lib/gazeDetection").then(({ detectGaze }) => {
      const gaze = detectGaze(landmarks, true);
      eyeTrackerRef.current.update(gaze);
      headTrackerRef.current.update(gaze.headYaw, gaze.headPitch);
      setLiveEyeContact(eyeTrackerRef.current.getPercentage());
    });

    import("@/lib/smileDetection").then(({ analyzeSmile, trackSmile }) => {
      const smileState = analyzeSmile(landmarks);
      smileEventsRef.current = trackSmile(smileState, smileEventsRef.current);
    });
  }, []);

  // Speech recognition
  const startSpeech = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = store.language === "id" ? "id-ID" : "en-US";
    let finalTranscript = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      const full = finalTranscript + interim;
      setTranscript(full);
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 0) setLiveWPM(calculateWPM(full, elapsed));
    };
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
  }, [store.language, startTime]);

  const stopSpeech = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  // Start recording when question loads
  useEffect(() => {
    setTranscript("");
    setTimer(QUESTION_DURATION);
    setStartTime(Date.now());
    setLiveWPM(0);
    eyeTrackerRef.current.reset();
    headTrackerRef.current.reset();
    smileEventsRef.current = [];
    if (faceMeshLoaded) startSpeech();
  }, [currentQ, faceMeshLoaded]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) { handleNextQuestion(); return; }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const buildCurrentAnswer = useCallback((): SessionQuestion => {
    const elapsed = (Date.now() - startTime) / 1000;
    const wpm = calculateWPM(transcript, elapsed);
    const fillerWords = detectFillerWords(transcript, store.language);
    const totalFillers = Object.values(fillerWords).reduce((a, b) => a + b, 0);
    const fluencyScore = calculateFluencyScore(transcript, wpm, fillerWords);
    const eyeContactPercent = eyeTrackerRef.current.getPercentage();
    const headStabilityPercent = headTrackerRef.current.getPercentage();
    const genuineSmileCount = smileEventsRef.current.filter((s) => s.type === "genuine").length;
    const fakeSmileCount = smileEventsRef.current.filter((s) => s.type === "fake").length;

    return {
      questionNumber: currentQ + 1,
      questionText: question,
      transcript,
      wpm,
      fluencyScore,
      fillerWords,
      eyeContactPercent,
      headStabilityPercent,
      genuineSmileCount,
      fakeSmileCount,
    };
  }, [transcript, store.language, startTime, currentQ, question]);

  const handleNextQuestion = useCallback(async () => {
    stopSpeech();
    const answer = buildCurrentAnswer();
    store.saveCurrentAnswer(answer);

    if (currentQ + 1 >= TOTAL_QUESTIONS) {
      await finishSession([...store.answers, answer]);
    } else {
      store.nextQuestion();
    }
  }, [currentQ, buildCurrentAnswer, stopSpeech, store]);

  const finishSession = async (allAnswers: SessionQuestion[]) => {
    setCompleting(true);
    stopSpeech();
    streamRef.current?.getTracks().forEach((t) => t.stop());

    try {
      // Generate AI feedback
      const feedbackRes = await fetch("/api/gemini/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: store.questions,
          transcripts: allAnswers.map((a) => a.transcript),
          language: store.language,
          jobPosition: store.jobPosition,
        }),
      });
      const feedbackData = feedbackRes.ok ? await feedbackRes.json() : null;

      // Attach feedback to answers
      const answersWithFeedback = allAnswers.map((a, i) => ({
        ...a,
        aiFeedback: feedbackData?.feedbackPerQuestion?.[i] || null,
      }));

      // Calculate metrics
      const avgWPM = Math.round(answersWithFeedback.reduce((s, a) => s + a.wpm, 0) / TOTAL_QUESTIONS);
      const avgEyeContact = Math.round(answersWithFeedback.reduce((s, a) => s + a.eyeContactPercent, 0) / TOTAL_QUESTIONS);
      const avgFluency = Math.round(answersWithFeedback.reduce((s, a) => s + a.fluencyScore, 0) / TOTAL_QUESTIONS);
      const totalFillers = answersWithFeedback.reduce((s, a) => s + Object.values(a.fillerWords).reduce((x, y) => x + y, 0), 0);
      const totalGenuine = answersWithFeedback.reduce((s, a) => s + a.genuineSmileCount, 0);
      const totalFake = answersWithFeedback.reduce((s, a) => s + a.fakeSmileCount, 0);
      const overallScore = calculateOverallScore(avgWPM, avgEyeContact, avgFluency, totalGenuine, totalFake);
      const pointsEarned = calculatePoints(overallScore, avgWPM, avgEyeContact, totalGenuine, avgFluency, store.difficulty, true);

      if (user) {
        const sessionId = await saveSession(user.uid, {
          jobPosition: store.jobPosition,
          difficulty: store.difficulty,
          language: store.language,
          overallScore,
          pointsEarned,
          avgWPM,
          avgEyeContact,
          avgFluency,
          totalFillerCount: totalFillers,
          questions: answersWithFeedback,
        });
        await updateStreak(user.uid);
        store.completeSession(sessionId);
        router.push(`/feedback/${sessionId}`);
      }
    } catch (e) {
      console.error("Error finishing session:", e);
      router.push("/dashboard");
    }
  };

  const progressPct = ((QUESTION_DURATION - timer) / QUESTION_DURATION) * 100;
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1a0a0a" }}>
      {/* Top bar */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.3)" }}>
        <span className="text-white/60 text-sm font-medium">
          Pertanyaan {currentQ + 1} dari {TOTAL_QUESTIONS}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
            <div key={i} className="w-8 h-1.5 rounded-full" style={{ background: i < currentQ ? "var(--primary)" : i === currentQ ? "white" : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
        <span className="text-white/60 text-sm">{store.jobPosition}</span>
      </div>

      <div className="flex-1 flex gap-4 px-6 pb-6 pt-2">
        {/* Camera Feed */}
        <div className="relative w-80 shrink-0 rounded-2xl overflow-hidden" style={{ background: "#000" }}>
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* Live Metrics Overlay */}
          <div className="absolute top-3 left-3 right-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white backdrop-blur-sm" style={{ background: "rgba(139,26,26,0.8)" }}>
              <div className={`w-2 h-2 rounded-full ${isRecording ? "bg-red-400 animate-pulse" : "bg-gray-400"}`} />
              {isRecording ? "Merekam" : "Diam"}
            </div>
            <div className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.6)" }}>
              👁 Kontak Mata: {liveEyeContact}%
            </div>
            <div className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.6)" }}>
              🏃 WPM: {liveWPM}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col">
          {/* Timer */}
          <div className="flex justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle cx="60" cy="60" r="54" fill="none" stroke={timer <= 5 ? "#C0392B" : "var(--primary)"}
                  strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference}
                  strokeDashoffset={circumference - (circumference * (timer / QUESTION_DURATION))}
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white font-heading">{timer}</span>
                <span className="text-white/50 text-xs">detik</span>
              </div>
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col">
              <div className="p-6 rounded-2xl mb-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: "var(--primary)" }}>Pertanyaan {currentQ + 1}</p>
                <p className="text-xl font-semibold text-white leading-relaxed font-heading">{question}</p>
              </div>

              {/* Transcript */}
              <div className="flex-1 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Transkripsi real-time:</p>
                <p className="text-sm leading-relaxed font-mono" style={{ color: transcript ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)" }}>
                  {transcript || "Mulai berbicara..."}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex gap-3 mt-4">
            <button onClick={handleNextQuestion} disabled={completing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-80"
              style={{ background: "var(--primary)" }}>
              {completing ? "Menyimpan..." : currentQ + 1 >= TOTAL_QUESTIONS ? "✓ Selesai" : <><SkipForward size={18} /> Pertanyaan Berikutnya</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
