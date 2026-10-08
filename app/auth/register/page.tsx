"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { registerUser } from "@/lib/firebase/auth";
import { JOB_TYPES } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "" as "male" | "female" | "",
    jobType: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (form.fullName.trim().length < 2) return "Nama minimal 2 karakter.";
    if (!form.email.includes("@")) return "Format email tidak valid.";
    if (form.password.length < 8) return "Password minimal 8 karakter.";
    if (!/[A-Z]/.test(form.password)) return "Password harus mengandung minimal 1 huruf besar.";
    if (!/[0-9]/.test(form.password)) return "Password harus mengandung minimal 1 angka.";
    if (form.password !== form.confirmPassword) return "Konfirmasi password tidak cocok.";
    if (!form.gender) return "Pilih jenis kelamin.";
    if (!form.jobType) return "Pilih jenis pekerjaan.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      await registerUser(
        form.email,
        form.password,
        form.fullName,
        form.gender as "male" | "female",
        form.jobType
      );
      router.push("/dashboard");
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/email-already-in-use") {
        setError("Email ini sudah terdaftar. Silakan masuk.");
      } else if (code === "auth/weak-password") {
        setError("Password terlalu lemah.");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border text-sm outline-none transition-all";
  const inputStyle = { borderColor: "var(--border)", background: "var(--background)", color: "var(--text-primary)" };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--background)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold font-heading" style={{ color: "var(--primary)" }}>
            Fluent<span style={{ color: "var(--text-primary)" }}>WEB</span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>Buat akun baru</p>
        </div>

        <div className="p-8 rounded-2xl border shadow-sm" style={{ background: "white", borderColor: "var(--border)" }}>
          <h1 className="text-2xl font-bold mb-6 font-heading" style={{ color: "var(--text-primary)" }}>
            Daftar ke FluentWEB 🚀
          </h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#FEE2E2", color: "var(--error)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Nama Lengkap *</label>
              <input type="text" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Nama lengkap kamu" className={inputClass} style={inputStyle} />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Email *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" className={inputClass} style={inputStyle} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Password *</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 karakter, 1 huruf besar, 1 angka" className={inputClass + " pr-12"} style={inputStyle} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Konfirmasi Password *</label>
              <input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Ulangi password" className={inputClass} style={inputStyle} />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>Jenis Kelamin *</label>
              <div className="flex gap-4">
                {(["male", "female"] as const).map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => setForm({ ...form, gender: g })} className="accent-primary" style={{ accentColor: "var(--primary)" }} />
                    <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {g === "male" ? "Laki-laki" : "Perempuan"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>Jenis Pekerjaan *</label>
              <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} className={inputClass} style={inputStyle} required>
                <option value="">— Pilih profesi kamu —</option>
                {JOB_TYPES.map((job) => (
                  <option key={job} value={job}>{job}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2 mt-2" style={{ background: "var(--primary)" }}>
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: "var(--primary)" }}>
              Masuk
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
