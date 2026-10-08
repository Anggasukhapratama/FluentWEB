"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Mic, Eye, Smile, ChevronDown, ChevronUp, RotateCcw, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getSessionWithQuestions } from "@/lib/firebase/firestore";
import { getWPMLabel, getEyeContactLabel } from "@/lib/speechAnalysis";
import { Session, SessionQuestion } from "@/types";

export default function FeedbackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(0);

  useEffect(() => {
    if (!user) return;
    getSessionWithQuestions(user.uid, sessionId).then((data) => {
      if (data) { setSession(data.session); setQuestions(data.questions); }
      setLoading(false);
    });
  }, [user, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          <p style={{ color: "var(--text-secondary)" }}>Memuat feedback...</p>
        </div>
      </div>
    );
  }

  if (!session) return <div className="min-h-screen flex items-center justify-center">Sesi tidak ditemukan.</div>;

  const wpmLabel = getWPMLabel(session.avgWPM);
  const eyeLabel = getEyeContactLabel(session.avgEyeContact);
  const scoreColor = session.overallScore >= 80 ? "#2D6A4F" : session.overallScore >= 60 ? "#D4730A" : "#C0392B";

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav className="border-b px-6 h-16 flex items-center justify-between sticky top-0 z-10" style={{ background: "white", borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="text-2xl font-bold font-heading" style={{ color: "var(--primary)" }}>
          Fluent<span style={{ color: "var(--text-primary)" }}>WEB</span>
        </Link>
        <div className="flex gap-3">
          <Link href="/setup" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
            <RotateCcw size={14} /> Latihan Lagi
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border" style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}>
            <Home size={14} /> Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Header Score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center p-10 rounded-3xl" style={{ background: "var(--primary)" }}>
          <p className="text-white/70 text-sm mb-2 uppercase tracking-wider">{session.jobPosition} · {session.difficulty}</p>
          <div className="text-7xl font-bold text-white font-heading mb-2">{session.overallScore}</div>
          <p className="text-white/80 text-lg">
            {session.overallScore >= 85 ? "🎉 Luar biasa! Performa sangat baik!" :
             session.overallScore >= 70 ? "💪 Bagus! Terus tingkatkan latihanmu." :
             session.overallScore >= 55 ? "📈 Cukup baik. Masih ada yang bisa diperbaiki." :
             "🌱 Jangan menyerah! Latihan terus!"}
          </p>
          <div className="flex justify-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-heading">+{session.pointsEarned}</div>
              <div className="text-white/60 text-xs">poin didapat</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-heading">{session.avgWPM}</div>
              <div className="text-white/60 text-xs">avg WPM</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white font-heading">{session.avgEyeContact}%</div>
              <div className="text-white/60 text-xs">eye contact</div>
            </div>
          </div>
        </motion.div>

        {/* Speech Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl border" style={{ background: "white", borderColor: "var(--border)" }}>
          <h2 className="text-xl font-bold font-heading mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Mic size={20} style={{ color: "var(--primary)" }} /> Analisis Bicara
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Rata-rata WPM", value: session.avgWPM, sub: wpmLabel.label, color: wpmLabel.color },
              { label: "Fluency Score", value: `${session.avgFluency}/100`, sub: session.avgFluency >= 75 ? "Baik" : "Perlu latihan", color: session.avgFluency >= 75 ? "#2D6A4F" : "#D4730A" },
              { label: "Total Filler", value: `${session.totalFillerCount}x`, sub: session.totalFillerCount <= 5 ? "Sangat baik" : session.totalFillerCount <= 10 ? "Cukup" : "Terlalu banyak", color: session.totalFillerCount <= 5 ? "#2D6A4F" : session.totalFillerCount <= 10 ? "#D4730A" : "#C0392B" },
              { label: "Total Sesi", value: "5 pertanyaan", sub: "30 detik/pertanyaan", color: "var(--text-secondary)" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl text-center" style={{ background: "var(--surface)" }}>
                <div className="text-2xl font-bold font-heading mb-1" style={{ color: "var(--text-primary)" }}>{item.value}</div>
                <div className="text-xs font-medium mb-1" style={{ color: item.color }}>{item.sub}</div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Face Detection Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl border" style={{ background: "white", borderColor: "var(--border)" }}>
          <h2 className="text-xl font-bold font-heading mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Eye size={20} style={{ color: "var(--primary)" }} /> Bahasa Tubuh & Ekspresi
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Kontak Mata", value: `${session.avgEyeContact}%`, sub: eyeLabel.label, color: eyeLabel.color },
              { label: "Stabilitas Kepala", value: `${questions[0]?.headStabilityPercent ?? 0}%`, sub: (questions[0]?.headStabilityPercent ?? 0) >= 75 ? "Stabil" : "Perlu diperhatikan", color: (questions[0]?.headStabilityPercent ?? 0) >= 75 ? "#2D6A4F" : "#D4730A" },
              { label: "Senyum Asli", value: `${questions.reduce((a, q) => a + q.genuineSmileCount, 0)}x`, sub: "Genuine smile", color: "#2D6A4F" },
              { label: "Senyum Palsu", value: `${questions.reduce((a, q) => a + q.fakeSmileCount, 0)}x`, sub: "Fake smile", color: "#C0392B" },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-xl text-center" style={{ background: "var(--surface)" }}>
                <div className="text-2xl font-bold font-heading mb-1" style={{ color: "var(--text-primary)" }}>{item.value}</div>
                <div className="text-xs font-medium mb-1" style={{ color: item.color }}>{item.sub}</div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{item.label}</div>
              </div>
            ))}
          </div>
          {/* Eye contact gauge */}
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
              <span>Gugup (&lt;70%)</span><span>Ideal (70-80%)</span><span>Intimidasi (&gt;80%)</span>
            </div>
            <div className="relative h-4 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
              <div className="absolute h-full rounded-full transition-all" style={{ width: `${Math.min(100, session.avgEyeContact)}%`, background: session.avgEyeContact >= 70 && session.avgEyeContact <= 80 ? "#2D6A4F" : "#D4730A" }} />
              <div className="absolute top-0 bottom-0 w-0.5" style={{ left: "70%", background: "var(--primary)" }} />
              <div className="absolute top-0 bottom-0 w-0.5" style={{ left: "80%", background: "var(--primary)" }} />
            </div>
          </div>
        </motion.div>

        {/* Per-Question AI Feedback */}
        <div>
          <h2 className="text-xl font-bold font-heading mb-5" style={{ color: "var(--text-primary)" }}>
            💡 Feedback per Pertanyaan
          </h2>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
                <button onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-opacity-50 transition-colors"
                  style={{ background: expanded === i ? "var(--surface)" : "white" }}>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "var(--primary)" }}>
                      {i + 1}
                    </span>
                    <span className="font-medium text-left" style={{ color: "var(--text-primary)" }}>{q.questionText}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-sm font-semibold" style={{ color: q.wpm >= 120 && q.wpm <= 160 ? "#2D6A4F" : "#D4730A" }}>{q.wpm} WPM</span>
                    {expanded === i ? <ChevronUp size={18} style={{ color: "var(--text-secondary)" }} /> : <ChevronDown size={18} style={{ color: "var(--text-secondary)" }} />}
                  </div>
                </button>

                {expanded === i && (
                  <div className="px-5 pb-5 space-y-4">
                    {/* Transcript */}
                    <div className="p-3 rounded-lg" style={{ background: "var(--surface)" }}>
                      <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Transkripsi jawaban:</p>
                      <p className="text-sm font-mono leading-relaxed" style={{ color: "var(--text-primary)" }}>
                        {q.transcript || "(Tidak ada jawaban)"}
                      </p>
                    </div>

                    {/* Metrics row */}
                    <div className="flex gap-3 flex-wrap">
                      {[
                        { label: "WPM", value: q.wpm },
                        { label: "Fluency", value: q.fluencyScore },
                        { label: "Eye Contact", value: `${q.eyeContactPercent}%` },
                        { label: "Filler", value: Object.values(q.fillerWords).reduce((a, b) => a + b, 0) + "x" },
                      ].map((m) => (
                        <div key={m.label} className="px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: "var(--surface)", color: "var(--text-primary)" }}>
                          {m.label}: {m.value}
                        </div>
                      ))}
                    </div>

                    {/* AI Feedback */}
                    {q.aiFeedback && (
                      <div className="space-y-3">
                        {q.aiFeedback.strengths?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#2D6A4F" }}>✅ Kelebihan</p>
                            <ul className="space-y-1">
                              {q.aiFeedback.strengths.map((s, j) => (
                                <li key={j} className="text-sm flex gap-2" style={{ color: "var(--text-primary)" }}>
                                  <span style={{ color: "#2D6A4F" }}>•</span> {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {q.aiFeedback.weaknesses?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#D4730A" }}>⚠️ Kekurangan</p>
                            <ul className="space-y-1">
                              {q.aiFeedback.weaknesses.map((w, j) => (
                                <li key={j} className="text-sm flex gap-2" style={{ color: "var(--text-primary)" }}>
                                  <span style={{ color: "#D4730A" }}>•</span> {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {q.aiFeedback.suggestions?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--primary)" }}>💡 Saran Perbaikan</p>
                            <ul className="space-y-1">
                              {q.aiFeedback.suggestions.map((s, j) => (
                                <li key={j} className="text-sm flex gap-2" style={{ color: "var(--text-primary)" }}>
                                  <span style={{ color: "var(--primary)" }}>•</span> {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {q.aiFeedback.idealAnswer && (
                          <div className="p-4 rounded-xl" style={{ background: "var(--surface)", borderLeft: "3px solid var(--primary)" }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>📝 Contoh Jawaban Ideal</p>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{q.aiFeedback.idealAnswer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="flex gap-4 justify-center pb-8">
          <Link href="/setup" className="px-8 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90" style={{ background: "var(--primary)" }}>
            🔄 Latihan Lagi
          </Link>
          <Link href="/history" className="px-8 py-3 rounded-xl font-semibold border transition-colors hover:bg-opacity-50" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
            📊 Lihat History
          </Link>
        </div>
      </div>
    </div>
  );
}
