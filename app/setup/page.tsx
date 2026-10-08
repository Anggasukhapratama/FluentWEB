"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Loader2, Mic, Camera } from "lucide-react";
import { useInterviewStore } from "@/store/interviewStore";
import { JOB_TYPES } from "@/types";
import Link from "next/link";

const STEPS = ["Posisi", "Kesulitan & Bahasa", "Izin Perangkat"];

export default function SetupPage() {
  const router = useRouter();
  const { setSetup, setQuestions } = useInterviewStore();
  const [step, setStep] = useState(0);
  const [jobPosition, setJobPosition] = useState("");
  const [customJob, setCustomJob] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [language, setLanguage] = useState<"id" | "en">("id");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [permGranted, setPermGranted] = useState(false);
  const [permError, setPermError] = useState("");

  const finalJob = jobPosition === "Lainnya" ? customJob : jobPosition;

  const requestPermissions = async () => {
    setPermError("");
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setPermGranted(true);
    } catch {
      setPermError("Izin kamera dan mikrofon diperlukan. Silakan izinkan akses di browser kamu.");
    }
  };

  const handleStart = async () => {
    if (!finalJob) { setError("Pilih posisi pekerjaan terlebih dahulu."); return; }
    setLoading(true);
    setError("");
    try {
      setSetup(finalJob, difficulty, language);
      const res = await fetch("/api/gemini/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobPosition: finalJob, difficulty, language }),
      });
      if (!res.ok) throw new Error("Gagal generate pertanyaan");
      const data = await res.json();
      setQuestions(data.questions);
      router.push("/interview");
    } catch {
      setError("Gagal membuat pertanyaan. Pastikan Gemini API Key sudah dikonfigurasi.");
    } finally {
      setLoading(false);
    }
  };

  const difficultyOptions = [
    { value: "easy", label: "Mudah", desc: "Perkenalan, motivasi, latar belakang", emoji: "😊" },
    { value: "medium", label: "Sedang", desc: "Situasional, STAR method, kompetensi", emoji: "💪" },
    { value: "hard", label: "Sulit", desc: "Case study, teknikal mendalam, behavioral", emoji: "🔥" },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav className="border-b px-6 h-16 flex items-center justify-between" style={{ background: "white", borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="text-2xl font-bold font-heading" style={{ color: "var(--primary)" }}>
          Fluent<span style={{ color: "var(--text-primary)" }}>WEB</span>
        </Link>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Setup Sesi Baru</span>
      </nav>

      {/* Progress Steps */}
      <div className="border-b py-4 px-6" style={{ background: "white", borderColor: "var(--border)" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i <= step ? "text-white" : "text-gray-400"}`}
                style={{ background: i <= step ? "var(--primary)" : "var(--surface)" }}>
                {i + 1}
              </div>
              <span className="text-xs hidden sm:block" style={{ color: i <= step ? "var(--primary)" : "var(--text-secondary)" }}>{s}</span>
              {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: i < step ? "var(--primary)" : "var(--border)" }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* Step 0: Job Position */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-3xl font-bold font-heading mb-2" style={{ color: "var(--text-primary)" }}>Pilih Posisi Pekerjaan</h2>
                <p className="mb-8" style={{ color: "var(--text-secondary)" }}>Pertanyaan akan disesuaikan dengan posisi yang kamu pilih.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {JOB_TYPES.map((job) => (
                    <button key={job} onClick={() => setJobPosition(job)}
                      className="p-3 rounded-xl border text-sm font-medium text-left transition-all hover:border-primary"
                      style={{ borderColor: jobPosition === job ? "var(--primary)" : "var(--border)", background: jobPosition === job ? "var(--surface)" : "white", color: jobPosition === job ? "var(--primary)" : "var(--text-primary)", borderWidth: jobPosition === job ? 2 : 1 }}>
                      {job}
                    </button>
                  ))}
                </div>
                {jobPosition === "Lainnya" && (
                  <input type="text" value={customJob} onChange={(e) => setCustomJob(e.target.value)}
                    placeholder="Tulis posisi pekerjaan kamu" className="w-full px-4 py-3 rounded-lg border text-sm outline-none mb-4"
                    style={{ borderColor: "var(--border)", background: "white", color: "var(--text-primary)" }} />
                )}
                {error && <p className="text-sm mb-4" style={{ color: "var(--error)" }}>{error}</p>}
                <button onClick={() => { if (!finalJob) { setError("Pilih posisi terlebih dahulu."); return; } setError(""); setStep(1); }}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "var(--primary)" }}>
                  Lanjut <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {/* Step 1: Difficulty + Language */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-3xl font-bold font-heading mb-2" style={{ color: "var(--text-primary)" }}>Tingkat Kesulitan & Bahasa</h2>
                <p className="mb-8" style={{ color: "var(--text-secondary)" }}>Pilih sesuai kebutuhan latihan kamu.</p>

                <div className="mb-8">
                  <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Tingkat Kesulitan</h3>
                  <div className="space-y-3">
                    {difficultyOptions.map((opt) => (
                      <button key={opt.value} onClick={() => setDifficulty(opt.value)}
                        className="w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all"
                        style={{ borderColor: difficulty === opt.value ? "var(--primary)" : "var(--border)", background: difficulty === opt.value ? "var(--surface)" : "white", borderWidth: difficulty === opt.value ? 2 : 1 }}>
                        <span className="text-2xl">{opt.emoji}</span>
                        <div>
                          <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{opt.label}</div>
                          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Bahasa Pertanyaan</h3>
                  <div className="flex gap-3">
                    {([{ v: "id", label: "🇮🇩 Indonesia" }, { v: "en", label: "🇬🇧 English" }] as const).map((l) => (
                      <button key={l.v} onClick={() => setLanguage(l.v)}
                        className="flex-1 py-3 rounded-xl border font-semibold transition-all"
                        style={{ borderColor: language === l.v ? "var(--primary)" : "var(--border)", background: language === l.v ? "var(--surface)" : "white", color: language === l.v ? "var(--primary)" : "var(--text-primary)", borderWidth: language === l.v ? 2 : 1 }}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="flex items-center gap-2 px-6 py-3 rounded-xl border font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                    <ChevronLeft size={18} /> Kembali
                  </button>
                  <button onClick={() => setStep(2)} className="flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90" style={{ background: "var(--primary)" }}>
                    Lanjut <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Permissions */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-3xl font-bold font-heading mb-2" style={{ color: "var(--text-primary)" }}>Izin Perangkat</h2>
                <p className="mb-8" style={{ color: "var(--text-secondary)" }}>Kamera dan mikrofon diperlukan untuk analisis real-time.</p>

                <div className="space-y-4 mb-8">
                  {[{ icon: Camera, label: "Kamera", desc: "Untuk deteksi wajah, kontak mata, dan senyum" },
                    { icon: Mic, label: "Mikrofon", desc: "Untuk transkripsi dan analisis bicara" }].map((item) => (
                    <div key={item.label} className="flex items-center gap-4 p-4 rounded-xl border" style={{ background: "white", borderColor: "var(--border)" }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--surface)" }}>
                        <item.icon size={20} style={{ color: "var(--primary)" }} />
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.label}</div>
                        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.desc}</div>
                      </div>
                      {permGranted && <div className="ml-auto text-green-600 text-sm font-semibold">✓ Diizinkan</div>}
                    </div>
                  ))}
                </div>

                {permError && <p className="text-sm mb-4" style={{ color: "var(--error)" }}>{permError}</p>}
                {error && <p className="text-sm mb-4" style={{ color: "var(--error)" }}>{error}</p>}

                {!permGranted ? (
                  <button onClick={requestPermissions} className="w-full py-3 rounded-xl text-white font-semibold mb-4 transition-opacity hover:opacity-90" style={{ background: "var(--primary)" }}>
                    Izinkan Kamera & Mikrofon
                  </button>
                ) : (
                  <button onClick={handleStart} disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-semibold mb-4 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ background: "var(--primary)" }}>
                    {loading && <Loader2 size={18} className="animate-spin" />}
                    {loading ? "Menyiapkan pertanyaan..." : "🚀 Mulai Wawancara!"}
                  </button>
                )}

                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <ChevronLeft size={16} /> Kembali
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
