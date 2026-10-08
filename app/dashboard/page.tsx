"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, TrendingUp, Mic, Eye, Flame, Plus, Clock, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { logoutUser } from "@/lib/firebase/auth";
import { getUserSessions } from "@/lib/firebase/firestore";
import { Session } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getUserSessions(user.uid).then((s) => {
        setSessions(s.slice(0, 3));
        setSessionsLoading(false);
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const avgWPM = sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.avgWPM || 0), 0) / sessions.length) : 0;
  const avgEye = sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.avgEyeContact || 0), 0) / sessions.length) : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav className="border-b px-6 h-16 flex items-center justify-between" style={{ background: "white", borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="text-2xl font-bold font-heading" style={{ color: "var(--primary)" }}>
          Fluent<span style={{ color: "var(--text-primary)" }}>WEB</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/history" className="text-sm font-medium hover:opacity-70" style={{ color: "var(--text-secondary)" }}>Riwayat</Link>
          <Link href="/leaderboard" className="text-sm font-medium hover:opacity-70" style={{ color: "var(--text-secondary)" }}>Peringkat</Link>
          <Link href="/profile" className="text-sm font-medium hover:opacity-70" style={{ color: "var(--text-secondary)" }}>Profil</Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold font-heading" style={{ color: "var(--text-primary)" }}>
            Halo, {profile.fullName?.split(" ")[0]}! 👋
          </h1>
          <p className="mt-1" style={{ color: "var(--text-secondary)" }}>
            Siap latihan wawancara hari ini?
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Poin", value: profile.totalPoints?.toLocaleString() || "0", icon: Trophy, color: "var(--primary)" },
            { label: "Total Sesi", value: sessions.length.toString(), icon: Mic, color: "#2D6A4F" },
            { label: "Rata-rata WPM", value: avgWPM || "—", icon: TrendingUp, color: "var(--primary)" },
            { label: "Streak 🔥", value: `${profile.streakDays || 0} hari`, icon: Flame, color: "#D4730A" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl border" style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{stat.label}</span>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
              <div className="text-2xl font-bold font-heading" style={{ color: "var(--text-primary)" }}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Main CTA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-8 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ background: "var(--primary)" }}>
          <div>
            <h2 className="text-2xl font-bold text-white font-heading mb-2">Mulai Latihan Sekarang</h2>
            <p className="text-white/80 text-sm">5 pertanyaan AI × 30 detik. Dapatkan feedback komprehensif.</p>
          </div>
          <Link href="/setup" className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-opacity hover:opacity-90 shrink-0"
            style={{ background: "var(--background)", color: "var(--primary)" }}>
            <Plus size={20} /> Latihan Baru
          </Link>
        </motion.div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/leaderboard" className="p-6 rounded-2xl border flex items-center gap-4 hover:shadow-md transition-shadow"
            style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface)" }}>
              <Trophy size={22} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <div className="font-semibold font-heading" style={{ color: "var(--text-primary)" }}>Papan Peringkat</div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>Lihat posisi kamu vs pengguna lain</div>
            </div>
            <ChevronRight size={18} className="ml-auto" style={{ color: "var(--text-secondary)" }} />
          </Link>
          <Link href="/history" className="p-6 rounded-2xl border flex items-center gap-4 hover:shadow-md transition-shadow"
            style={{ background: "white", borderColor: "var(--border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--surface)" }}>
              <TrendingUp size={22} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <div className="font-semibold font-heading" style={{ color: "var(--text-primary)" }}>Riwayat & Grafik</div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>Pantau perkembanganmu dari waktu ke waktu</div>
            </div>
            <ChevronRight size={18} className="ml-auto" style={{ color: "var(--text-secondary)" }} />
          </Link>
        </div>

        {/* Recent Sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-heading" style={{ color: "var(--text-primary)" }}>Sesi Terakhir</h2>
            <Link href="/history" className="text-sm font-medium hover:underline" style={{ color: "var(--primary)" }}>Lihat semua →</Link>
          </div>
          {sessionsLoading ? (
            <div className="text-center py-8" style={{ color: "var(--text-secondary)" }}>Memuat...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              <Mic size={40} className="mx-auto mb-3 opacity-30" />
              <p>Belum ada sesi latihan.</p>
              <Link href="/setup" className="mt-4 inline-block px-6 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: "var(--primary)" }}>
                Mulai Sekarang
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <Link key={s.id} href={`/feedback/${s.id}`}
                  className="flex items-center justify-between p-5 rounded-xl border hover:shadow-md transition-shadow"
                  style={{ background: "white", borderColor: "var(--border)" }}>
                  <div>
                    <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{s.jobPosition}</div>
                    <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {s.difficulty} · {s.avgWPM} WPM · {s.avgEyeContact}% eye contact
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xl font-bold font-heading" style={{ color: "var(--primary)" }}>{s.overallScore}</div>
                      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>skor</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: "#2D6A4F" }}>+{s.pointsEarned}</div>
                      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>poin</div>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--text-secondary)" }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
