"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mic, Eye, Brain, Trophy, ChevronRight, Star, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Analisis Bicara",
    desc: "Deteksi WPM, kelancaran, dan kata pengisi (filler words) secara real-time.",
  },
  {
    icon: Eye,
    title: "Deteksi Kontak Mata",
    desc: "Computer vision menganalisis kontak mata dan arah pandangan kepalamu.",
  },
  {
    icon: Brain,
    title: "AI Gemini",
    desc: "Pertanyaan disesuaikan dengan posisi & tingkat kesulitan. Feedback dari Gemini AI.",
  },
  {
    icon: Trophy,
    title: "Papan Peringkat",
    desc: "Kumpulkan poin setiap sesi dan bersaing di papan peringkat global.",
  },
];

const stats = [
  { label: "Pengguna Aktif", value: "10K+" },
  { label: "Sesi Latihan", value: "50K+" },
  { label: "Posisi Pekerjaan", value: "13+" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: "rgba(253,246,236,0.95)", borderColor: "var(--border)", backdropFilter: "blur(8px)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-2xl font-bold font-heading" style={{ color: "var(--primary)" }}>
            Fluent<span style={{ color: "var(--text-primary)" }}>WEB</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
              Masuk
            </Link>
            <Link href="/auth/register" className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "var(--primary)" }}>
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6" style={{ background: "var(--surface)", color: "var(--primary)" }}>
              🎯 AI-Powered Interview Coach
            </span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
              Latih Wawancara Kerja{" "}
              <span style={{ color: "var(--primary)" }}>Lebih Cerdas</span>
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Analisis kelancaran bicara, kontak mata, dan ekspresi wajah secara real-time. Dapatkan feedback dari AI Gemini dan pantau perkembanganmu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-lg transition-opacity hover:opacity-90 shadow-lg" style={{ background: "var(--primary)" }}>
                Mulai Gratis <ChevronRight size={20} />
              </Link>
              <Link href="/auth/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg border-2 transition-colors hover:bg-opacity-50" style={{ borderColor: "var(--primary)", color: "var(--primary)" }}>
                Sudah punya akun?
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex justify-center gap-12 mt-16">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold font-heading" style={{ color: "var(--primary)" }}>{s.value}</div>
                <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6" style={{ background: "var(--surface)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4 font-heading" style={{ color: "var(--text-primary)" }}>
              Semua yang Kamu Butuhkan
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>Teknologi AI terdepan untuk persiapan wawancara yang optimal</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} className="p-6 rounded-2xl border" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--primary)", color: "white" }}>
                  <f.icon size={22} />
                </div>
                <h3 className="font-semibold text-lg mb-2 font-heading" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4 font-heading" style={{ color: "var(--text-primary)" }}>Cara Kerja</h2>
          </div>
          <div className="space-y-6">
            {[
              { step: "01", title: "Pilih Posisi & Kesulitan", desc: "Pilih jenis pekerjaan dan tingkat kesulitan pertanyaan yang diinginkan." },
              { step: "02", title: "Jawab 5 Pertanyaan AI", desc: "Gemini AI akan membuat 5 pertanyaan relevan. Kamu punya 30 detik per pertanyaan." },
              { step: "03", title: "Analisis Real-time", desc: "Sistem mendeteksi WPM, filler words, kontak mata, dan keaslian senyummu secara otomatis." },
              { step: "04", title: "Dapatkan Feedback", desc: "Setelah selesai, terima feedback komprehensif dan saran perbaikan dari AI." },
            ].map((item) => (
              <motion.div key={item.step} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} className="flex gap-6 p-6 rounded-2xl" style={{ background: "var(--surface)", border: `1px solid var(--border)` }}>
                <span className="text-4xl font-bold font-heading shrink-0" style={{ color: "var(--primary)", opacity: 0.4 }}>{item.step}</span>
                <div>
                  <h3 className="font-semibold text-lg mb-1 font-heading" style={{ color: "var(--text-primary)" }}>{item.title}</h3>
                  <p style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6" style={{ background: "var(--primary)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 font-heading text-white">Siap Memulai?</h2>
          <p className="text-white/80 mb-8">Daftar gratis dan mulai latihan wawancara pertamamu sekarang.</p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-opacity hover:opacity-90" style={{ background: "var(--background)", color: "var(--primary)" }}>
            Daftar Sekarang <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}>
        © 2026 FluentWEB. Dibuat dengan ❤️ untuk para job seeker Indonesia.
      </footer>
    </main>
  );
}
