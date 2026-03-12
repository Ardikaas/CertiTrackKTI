import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from "lucide-react";

const API_BASE = "http://localhost:5000/api/v1";

const Signup = () => {
  const [form, setForm] = useState({ username: "", name: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Password dan konfirmasi tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.message || "Registrasi gagal");
      // Auto-login setelah register
      await login(form.username, form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Registrasi gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#00a1d1] focus:ring-[3px] focus:ring-[#00a1d1]/10 hover:border-slate-300 transition-all shadow-sm";

  return (
    <div className="min-h-screen flex font-display">
      {/* Left Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 text-white relative overflow-hidden"
        style={{ backgroundColor: "#00a1d1" }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5"></div>
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5"></div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <img src="/krakatau.png" alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
          <span className="font-extrabold text-2xl tracking-tight">CertiTrack</span>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Pendaftaran Akun<br />Pengguna Baru
          </h1>
          <p className="text-white/75 text-base font-medium leading-relaxed max-w-sm">
            Daftarkan akun Anda untuk mengakses sistem manajemen sertifikasi peralatan industri PT Krakatau Engineering.
          </p>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-extrabold">Cepat</p>
              <p className="text-white/60 text-xs font-semibold mt-0.5">Akses Instan</p>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="text-center">
              <p className="text-2xl font-extrabold">Mudah</p>
              <p className="text-white/60 text-xs font-semibold mt-0.5">Kelola Data</p>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="text-center">
              <p className="text-2xl font-extrabold">Terpercaya</p>
              <p className="text-white/60 text-xs font-semibold mt-0.5">Sistem Terpusat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pendaftaran Akun</h2>
            <p className="text-slate-500 text-sm font-medium mt-1.5">
              Silakan lengkapi formulir di bawah ini untuk mendaftarkan akun baru.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-800 font-semibold shadow-sm">
              <div className="p-1 bg-white rounded-full shadow-sm shrink-0">
                <AlertCircle size={16} className="text-rose-600" />
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Nama Lengkap */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Nama Lengkap</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#00a1d1] transition-colors text-[20px]">badge</span>
                </div>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan nama lengkap"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Username */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Nama Pengguna</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#00a1d1] transition-colors text-[20px]">person</span>
                </div>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  autoComplete="username"
                  placeholder="Buat nama pengguna"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Kata Sandi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#00a1d1] transition-colors text-[20px]">lock</span>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  placeholder="Minimal 6 karakter"
                  className={`${inputClass} pr-12`}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Konfirmasi Kata Sandi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#00a1d1] transition-colors text-[20px]">lock</span>
                </div>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  placeholder="Ketik ulang kata sandi"
                  className={`${inputClass} pr-12 ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                      : form.confirmPassword && form.password === form.confirmPassword
                      ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
                      : ""
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {/* Ceklis di luar field sebelah kanan */}
                {form.confirmPassword && form.password === form.confirmPassword && (
                  <div className="absolute inset-y-0 -right-8 flex items-center pointer-events-none">
                    <CheckCircle size={20} className="text-emerald-500" />
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{ backgroundColor: "#00a1d1" }}
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <UserPlus size={18} strokeWidth={2.5} />
              )}
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500 mt-6">
            Sudah memiliki akun?{" "}
            <Link to="/login" className="font-bold text-[#00a1d1] hover:underline">
              Masuk
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 font-medium mt-6">
            PT Krakatau Engineering — CertiTrack KTI
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
