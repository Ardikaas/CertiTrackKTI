import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login gagal. Periksa kembali username dan password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-display">
      {/* Left Panel — Brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 text-white relative overflow-hidden"
        style={{ backgroundColor: "#00a1d1" }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5"></div>
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.03]"></div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <img src="/krakatau.png" alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
          <span className="font-extrabold text-2xl tracking-tight">CertiTrack</span>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Manajemen Sertifikasi<br />Peralatan Industri
          </h1>
          <p className="text-white/75 text-base font-medium leading-relaxed max-w-sm">
            Pantau masa berlaku sertifikasi, kelola dokumen, dan terima notifikasi otomatis melalui WhatsApp.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-extrabold">100%</p>
            <p className="text-white/60 text-xs font-semibold mt-0.5">Notifikasi Otomatis</p>
          </div>
          <div className="h-10 w-px bg-white/20"></div>
          <div className="text-center">
            <p className="text-2xl font-extrabold">Real-time</p>
            <p className="text-white/60 text-xs font-semibold mt-0.5">Status Monitoring</p>
          </div>
          <div className="h-10 w-px bg-white/20"></div>
          <div className="text-center">
            <p className="text-2xl font-extrabold">Aman</p>
            <p className="text-white/60 text-xs font-semibold mt-0.5">Data Tersimpan Aman</p>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <img src="/krakatau.png" alt="Logo" className="w-9 h-9 object-contain" style={{ filter: "invert(50%) sepia(100%) saturate(500%) hue-rotate(160deg)" }} />
          <span className="font-extrabold text-2xl tracking-tight text-slate-800">CertiTrack</span>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="text-slate-500 text-sm font-medium mt-1.5">
              Silakan masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-800 font-semibold shadow-sm">
              <div className="p-1 bg-white rounded-full shadow-sm shrink-0">
                <AlertCircle size={16} className="text-rose-600" />
              </div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Nama Pengguna</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#00a1d1] transition-colors text-[20px]">
                    person
                  </span>
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Masukkan nama pengguna"
                  className="w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#00a1d1] focus:ring-[3px] focus:ring-[#00a1d1]/10 hover:border-slate-300 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Kata Sandi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#00a1d1] transition-colors text-[20px]">
                    lock
                  </span>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-11 pr-12 py-3.5 border border-slate-200 rounded-xl bg-white text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:border-[#00a1d1] focus:ring-[3px] focus:ring-[#00a1d1]/10 hover:border-slate-300 transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-white font-bold text-sm transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{ backgroundColor: "#00a1d1" }}
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
              ) : (
                <LogIn size={18} strokeWidth={2.5} />
              )}
              {loading ? "Masuk..." : "Masuk"}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500 mt-6">
            Belum memiliki akun?{" "}
            <Link to="/signup" className="font-bold text-[#00a1d1] hover:underline">
              Daftar Sekarang
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 font-medium mt-8">
            PT Krakatau Tirta Industri — Pusat Perawatan & HSE
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
