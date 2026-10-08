"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Medal, Star } from "lucide-react";
import { getLeaderboard, getLeaderboardByJob } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { LeaderboardEntry } from "@/types";

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<(LeaderboardEntry & { rank: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"global" | "job">("global");

  useEffect(() => {
    setLoading(true);
    const fetchBoard = async () => {
      try {
        if (filter === "global") {
          const data = await getLeaderboard(50);
          setEntries(data);
        } else if (filter === "job" && profile?.jobType) {
          const data = await getLeaderboardByJob(profile.jobType, 50);
          setEntries(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, [filter, profile]);

  const userEntry = entries.find(e => e.id === user?.uid);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy size={20} className="text-yellow-500" />;
    if (rank === 2) return <Medal size={20} className="text-gray-400" />;
    if (rank === 3) return <Medal size={20} className="text-amber-700" />;
    return <span className="font-bold text-gray-500">#{rank}</span>;
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav className="border-b px-6 h-16 flex items-center sticky top-0 z-10" style={{ background: "white", borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="flex items-center gap-2 font-medium transition-opacity hover:opacity-70" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft size={18} /> Kembali ke Dashboard
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "var(--surface)" }}>
            <Trophy size={32} style={{ color: "var(--primary)" }} />
          </div>
          <h1 className="text-3xl font-bold font-heading mb-2" style={{ color: "var(--text-primary)" }}>Papan Peringkat</h1>
          <p style={{ color: "var(--text-secondary)" }}>Kumpulkan poin dan bersaing menjadi yang terbaik.</p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-3 mb-8">
          <button 
            onClick={() => setFilter("global")}
            className="px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
            style={{ 
              background: filter === "global" ? "var(--primary)" : "white",
              color: filter === "global" ? "white" : "var(--text-primary)",
              border: `1px solid ${filter === "global" ? "var(--primary)" : "var(--border)"}`
            }}
          >
            🌍 Global
          </button>
          {profile?.jobType && (
            <button 
              onClick={() => setFilter("job")}
              className="px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
              style={{ 
                background: filter === "job" ? "var(--primary)" : "white",
                color: filter === "job" ? "white" : "var(--text-primary)",
                border: `1px solid ${filter === "job" ? "var(--primary)" : "var(--border)"}`
              }}
            >
              💼 Sesama Profesi ({profile.jobType})
            </button>
          )}
        </div>

        {loading ? (
           <div className="text-center py-20">
             <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
           </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border" style={{ background: "white", borderColor: "var(--border)" }}>
            <p style={{ color: "var(--text-secondary)" }}>Belum ada data peringkat.</p>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ background: "white", borderColor: "var(--border)" }}>
            {/* Table Header */}
            <div className="flex items-center px-6 py-4 border-b text-xs font-semibold uppercase tracking-wider" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              <div className="w-16 text-center">Rank</div>
              <div className="flex-1 px-4">Nama</div>
              <div className="flex-1 hidden sm:block">Profesi</div>
              <div className="w-24 text-right">Total Poin</div>
            </div>

            {/* List */}
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {entries.map((entry) => {
                const isCurrentUser = entry.id === user?.uid;
                
                return (
                  <div 
                    key={entry.id} 
                    className="flex items-center px-6 py-4 transition-colors"
                    style={{ background: isCurrentUser ? "var(--surface)" : "transparent" }}
                  >
                    <div className="w-16 flex justify-center">
                      {getRankBadge(entry.rank)}
                    </div>
                    
                    <div className="flex-1 px-4">
                      <div className="font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        {entry.fullName}
                        {isCurrentUser && <span className="text-[10px] px-2 py-0.5 rounded bg-primary text-white" style={{ background: "var(--primary)" }}>KAMU</span>}
                      </div>
                    </div>

                    <div className="flex-1 hidden sm:block text-sm" style={{ color: "var(--text-secondary)" }}>
                      {entry.jobType}
                    </div>

                    <div className="w-24 text-right">
                      <span className="font-bold font-heading text-lg" style={{ color: "var(--primary)" }}>
                        {entry.totalPoints.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Current User Rank Bar (if not loading and user exists) */}
      {!loading && user && profile && (
        <div className="fixed bottom-0 left-0 right-0 border-t shadow-lg z-20" style={{ background: "white", borderColor: "var(--border)" }}>
          <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white" style={{ background: "var(--primary)" }}>
                #{userEntry?.rank || "-"}
              </div>
              <div>
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>Posisi Kamu Saat Ini</div>
                <div className="text-xs" style={{ color: "var(--text-secondary)" }}>Total: {profile.totalPoints?.toLocaleString() || 0} poin</div>
              </div>
            </div>
            
            <Link href="/setup" className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity hover:opacity-90" style={{ background: "var(--primary)" }}>
              <Star size={16} /> Cari Poin Lagi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
