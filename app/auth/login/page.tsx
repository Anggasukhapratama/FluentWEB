"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loginUser } from "@/lib/firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginUser(form.email, form.password);
      router.push("/dashboard");
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setError("Email atau password salah.");
      } else if (code === "auth/user-not-found") {
        setError("Akun tidak ditemukan. Silakan daftar terlebih dahulu.");
      } else if (code === "auth/too-many-requests") {
        setError("Terlalu banyak percobaan. Coba lagi beberapa menit.");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold font-heading" style={{ color: "var(--primary)" }}>
            Fluent<span style={{ color: "var(--text-primary)" }}>WEB</span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            Masuk ke akun kamu
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl border shadow-sm" style={{ background: "white", borderColor: "var(--border)" }}>
          <h1 className="text-2xl font-bold mb-6 font-heading" style={{ color: "var(--text-primary)" }}>
            Selamat Datang Kembali 👋
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#FEE2E2", color: "var(--error)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@contoh.com"
                className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all focus:ring-2"
                style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--text-primary)", ["--tw-ring-color" as any]: "var(--primary)" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all pr-12"
                  style={{ borderColor: "var(--border)", background: "var(--background)", color: "var(--text-primary)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="text-right mt-1">
                <Link href="/auth/forgot-password" className="text-xs hover:underline" style={{ color: "var(--primary)" }}>
                  Lupa password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2 mt-2"
              style={{ background: "var(--primary)" }}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            Belum punya akun?{" "}
            <Link href="/auth/register" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>
              Daftar sekarang
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
