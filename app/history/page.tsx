"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getUserSessions } from "@/lib/firebase/firestore";
import { Session } from "@/types";

export default function HistoryPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserSessions(user.uid).then((data) => {
      // Urutkan dari yang terlama ke terbaru untuk chart
      const sorted = [...data].reverse();
      setSessions(sorted);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  // Data formatters for charts
  const chartData = sessions.map((s, i) => ({
    name: `Sesi ${i + 1}`,
    wpm: s.avgWPM,
    eyeContact: s.avgEyeContact,
    score: s.overallScore,
    fluency: s.avgFluency,
    date: new Date(s.createdAt).toLocaleDateString("id-ID", { month: "short", day: "numeric" }),
    fullDate: new Date(s.createdAt).toLocaleDateString("id-ID"),
    position: s.jobPosition
  }));

  // Aggregate filler words for pie chart
  const fillerCounts: Record<string, number> = {};
  sessions.forEach(s => {
    if (s.questions) {
      s.questions.forEach(q => {
        if (q.fillerWords) {
          Object.entries(q.fillerWords).forEach(([word, count]) => {
            fillerCounts[word] = (fillerCounts[word] || 0) + count;
          });
        }
      });
    }
  });

  const pieData = Object.entries(fillerCounts)
    .sort((a, b) => b[1] - a[1]) // Sort descending
    .slice(0, 5) // Top 5
    .map(([name, value]) => ({ name, value }));

  const COLORS = ['#8B1A1A', '#A52828', '#D4730A', '#2D6A4F', '#6B4C3B'];

  return (
    <div className="min-h-screen pb-20" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav className="border-b px-6 h-16 flex items-center sticky top-0 z-10" style={{ background: "white", borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2 font-medium" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={18} /> Kembali ke Dashboard
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold font-heading mb-2" style={{ color: "var(--text-primary)" }}>Riwayat & Grafik</h1>
        <p className="mb-10" style={{ color: "var(--text-secondary)" }}>Pantau perkembangan performa wawancara kamu.</p>

        {sessions.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border" style={{ borderColor: "var(--border)", background: "white" }}>
            <p style={{ color: "var(--text-secondary)" }}>Belum ada data sesi latihan.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Score Trend Chart */}
              <div className="p-6 rounded-2xl border" style={{ background: "white", borderColor: "var(--border)" }}>
                <h3 className="font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Skor Keseluruhan</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="score" name="Skor" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* WPM Trend Chart */}
              <div className="p-6 rounded-2xl border" style={{ background: "white", borderColor: "var(--border)" }}>
                <h3 className="font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Kecepatan Bicara (WPM)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                      />
                      {/* Ideal range highlight */}
                      <rect y={120} height={40} width="100%" fill="#2D6A4F" fillOpacity={0.1} />
                      <Line type="monotone" dataKey="wpm" name="WPM" stroke="#D4730A" strokeWidth={3} dot={{ r: 4, fill: "#D4730A" }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Eye Contact Chart */}
              <div className="p-6 rounded-2xl border" style={{ background: "white", borderColor: "var(--border)" }}>
                <h3 className="font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Kontak Mata (%)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "var(--text-secondary)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                        cursor={{ fill: 'var(--surface)' }}
                      />
                      <Bar dataKey="eyeContact" name="Kontak Mata" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Filler Words Pie Chart */}
              <div className="p-6 rounded-2xl border" style={{ background: "white", borderColor: "var(--border)" }}>
                <h3 className="font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Distribusi Kata Pengisi (Top 5)</h3>
                <div className="h-64">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                     <div className="h-full flex items-center justify-center" style={{ color: "var(--text-secondary)" }}>
                       Belum ada data kata pengisi
                     </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sessions Table */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: "white", borderColor: "var(--border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: "var(--surface)", color: "var(--text-primary)" }}>
                      <th className="p-4 font-semibold text-sm whitespace-nowrap">Tanggal</th>
                      <th className="p-4 font-semibold text-sm whitespace-nowrap">Posisi</th>
                      <th className="p-4 font-semibold text-sm whitespace-nowrap">Level</th>
                      <th className="p-4 font-semibold text-sm whitespace-nowrap">Skor</th>
                      <th className="p-4 font-semibold text-sm whitespace-nowrap">WPM</th>
                      <th className="p-4 font-semibold text-sm whitespace-nowrap">Kontak Mata</th>
                      <th className="p-4 font-semibold text-sm whitespace-nowrap text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Urutkan kembali terbaru di atas untuk tabel */}
                    {[...sessions].reverse().map((s) => (
                      <tr key={s.id} className="border-t transition-colors hover:bg-gray-50" style={{ borderColor: "var(--border)" }}>
                        <td className="p-4 text-sm" style={{ color: "var(--text-primary)" }}>
                          {new Date(s.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-4 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.jobPosition}</td>
                        <td className="p-4 text-sm capitalize" style={{ color: "var(--text-secondary)" }}>{s.difficulty}</td>
                        <td className="p-4 text-sm font-bold" style={{ color: "var(--primary)" }}>{s.overallScore}</td>
                        <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>{s.avgWPM}</td>
                        <td className="p-4 text-sm" style={{ color: "var(--text-secondary)" }}>{s.avgEyeContact}%</td>
                        <td className="p-4 text-sm text-right">
                          <Link href={`/feedback/${s.id}`} className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
