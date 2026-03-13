import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../utils/api";
import {
  Wifi,
  WifiOff,
  Loader,
  LogOut,
  RefreshCw,
  QrCode,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  X,
  PlayCircle,
  Settings,
} from "lucide-react";

// Helper components for missing icons
const GroupsIcon = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ToggleRight = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <rect x="2" y="6" width="20" height="12" rx="6" />
    <circle cx="16" cy="12" r="4" fill="white" />
  </svg>
);

const ToggleLeft = ({ size, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <rect x="2" y="6" width="20" height="12" rx="6" />
    <circle cx="8" cy="12" r="4" fill="white" />
  </svg>
);

const WA_API = "/whatsapp";
const NOTIF_API = "/notifications";

const WhatsApp = () => {
  // Connection state
  const [status, setStatus] = useState("disconnected");
  const [qrCode, setQrCode] = useState(null);
  const [qrMessage, setQrMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [connectingService, setConnectingService] = useState(false);

  // Notification settings state
  const [settings, setSettings] = useState({
    recipients: [],
    enabledTypes: { expiringSoon: true, weeklyCheck: true, expired: true },
    expiringDays: 30,
  });
  const [newRecipient, setNewRecipient] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsResult, setSettingsResult] = useState(null);
  const [testingNotif, setTestingNotif] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testMinutes, setTestMinutes] = useState(5);
  const [testingMinutesNotif, setTestingMinutesNotif] = useState(false);

  // Notification logs
  const [logs, setLogs] = useState([]);

  // Fetch WhatsApp status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch(`${WA_API}/status`);
      const data = await res.json();
      setStatus(data.data.connectionStatus);
    } catch {
      setStatus("disconnected");
    }
  }, []);

  // Fetch QR code
  const fetchQR = useCallback(async () => {
    try {
      const res = await apiFetch(`${WA_API}/qr`);
      const data = await res.json();
      if (data.data.qr) {
        setQrCode(data.data.qr);
        setQrMessage("");
      } else {
        setQrCode(null);
        setQrMessage(data.data.message || "");
      }
    } catch {
      setQrCode(null);
      setQrMessage("Failed to fetch QR code");
    }
  }, []);

  // Fetch notification settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await apiFetch(`${NOTIF_API}/settings`);
      const data = await res.json();
      if (data.status === "success" && data.data) setSettings(data.data);
    } catch {
      /* keep defaults */
    }
  }, []);

  // Fetch notification logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await apiFetch(`${NOTIF_API}/log`);
      const data = await res.json();
      if (data.status === "success") setLogs(data.data);
    } catch {
      /* ignore */
    }
  }, []);

  // Initialize WhatsApp on page mount, then poll status/QR every 3 seconds
  useEffect(() => {
    // Initialize WhatsApp service when page loads
    const initService = async () => {
      try {
        await apiFetch(`${WA_API}/init`, { method: "POST" });
        setStatus("connecting");
        setQrMessage("Memulai layanan WhatsApp...");
      } catch (err) {
        console.error("Failed to initialize WhatsApp:", err);
      }
    };

    initService();
    fetchSettings();
    fetchLogs();

    // Poll for status and QR code
    const interval = setInterval(() => {
      fetchStatus();
      if (status !== "open") fetchQR();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchStatus, fetchQR, fetchSettings, fetchLogs, status]);

  // Logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await apiFetch(`${WA_API}/logout`, { method: "POST" });
      setStatus("disconnected");
      setQrCode(null);
    } catch {
      /* ignore */
    } finally {
      setLoggingOut(false);
    }
  };

  // Reconnect / Init service
  const handleReconnect = async () => {
    setConnectingService(true);
    try {
      await apiFetch(`${WA_API}/init`, { method: "POST" });
      setStatus("connecting");
      setQrMessage("Memulai layanan WhatsApp...");
    } catch {
      /* ignore */
    } finally {
      setConnectingService(false);
    }
  };

  // Add recipient
  const addRecipient = () => {
    if (!newRecipient || !settings) return;
    const cleaned = newRecipient.replace(/[\s\-+()]/g, "");
    if (settings.recipients.includes(cleaned)) return;
    setSettings({ ...settings, recipients: [...settings.recipients, cleaned] });
    setNewRecipient("");
  };

  // Remove recipient
  const removeRecipient = (phone) => {
    if (!settings) return;
    setSettings({
      ...settings,
      recipients: settings.recipients.filter((r) => r !== phone),
    });
  };

  // Toggle notification type
  const toggleType = (key) => {
    if (!settings) return;
    setSettings({
      ...settings,
      enabledTypes: {
        ...settings.enabledTypes,
        [key]: !settings.enabledTypes[key],
      },
    });
  };

  // Save settings
  const saveSettings = async () => {
    setSavingSettings(true);
    setSettingsResult(null);
    try {
      const res = await apiFetch(`${NOTIF_API}/settings`, {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.status === "success") {
        setSettings(data.data);
        setSettingsResult({
          type: "success",
          text: "Pengaturan berhasil disimpan!",
        });
        setTimeout(() => setSettingsResult(null), 4000);
      } else {
        setSettingsResult({
          type: "error",
          text: "Gagal menyimpan pengaturan",
        });
        setTimeout(() => setSettingsResult(null), 4000);
      }
    } catch {
      setSettingsResult({ type: "error", text: "Gagal menyimpan pengaturan." });
      setTimeout(() => setSettingsResult(null), 4000);
    } finally {
      setSavingSettings(false);
    }
  };

  // Test notification
  const testNotification = async () => {
    setTestingNotif(true);
    setTestResult(null);
    try {
      const res = await apiFetch(`${NOTIF_API}/test`, {
        method: "POST",
        body: JSON.stringify({ type: "all" }),
      });
      const data = await res.json();
      if (data.status === "success") {
        if (data.data.error) {
          setTestResult({ type: "error", text: data.data.error });
          setTimeout(() => setTestResult(null), 4000);
        } else {
          setTestResult({
            type: "success",
            text: "Test notifikasi berhasil dikirim!",
          });
          setTimeout(() => setTestResult(null), 4000);
          fetchLogs();
        }
      } else {
        setTestResult({
          type: "error",
          text: data.message || "Gagal mengirim test",
        });
        setTimeout(() => setTestResult(null), 4000);
      }
    } catch {
      setTestResult({ type: "error", text: "Gagal mengirim test notifikasi." });
      setTimeout(() => setTestResult(null), 4000);
    } finally {
      setTestingNotif(false);
    }
  };

  // Test notification with minutes (for testing expiration logic quickly)
  const testNotificationWithMinutes = async () => {
    setTestingMinutesNotif(true);
    setTestResult(null);
    try {
      const res = await apiFetch(`${NOTIF_API}/test-minutes`, {
        method: "POST",
        body: JSON.stringify({ minutes: testMinutes }),
      });
      const data = await res.json();
      if (data.status === "success") {
        if (data.data.error) {
          setTestResult({ type: "error", text: data.data.error });
          setTimeout(() => setTestResult(null), 4000);
        } else {
          setTestResult({
            type: "success",
            text: `Test dengan ${testMinutes} menit berhasil dikirim!`,
          });
          setTimeout(() => setTestResult(null), 4000);
          fetchLogs();
        }
      } else {
        setTestResult({
          type: "error",
          text: data.message || "Gagal mengirim test",
        });
        setTimeout(() => setTestResult(null), 4000);
      }
    } catch {
      setTestResult({ type: "error", text: "Gagal mengirim test notifikasi." });
      setTimeout(() => setTestResult(null), 4000);
    } finally {
      setTestingMinutesNotif(false);
    }
  };

  const statusConfig = {
    open: {
      color: "bg-emerald-500",
      text: "WhatsApp Terhubung",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: Wifi,
    },
    connecting: {
      color: "bg-amber-500",
      text: "Menghubungkan...",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: Loader,
    },
    disconnected: {
      color: "bg-slate-400",
      text: "Tidak Terhubung",
      textColor: "text-slate-600",
      bgColor: "bg-slate-100",
      borderColor: "border-slate-200",
      icon: WifiOff,
    },
  };
  const currentStatus = statusConfig[status] || statusConfig.disconnected;
  const StatusIcon = currentStatus.icon;

  const notifTypes = [
    {
      key: "expiringSoon",
      label: "Peringatan Masa Berlaku",
      desc: "Sertifikasi yang akan habis masa berlakunya",
      icon: <AlertTriangle size={24} className="text-amber-500" />,
      bg: "bg-amber-50",
    },
    {
      key: "weeklyCheck",
      label: "Ringkasan Mingguan",
      desc: "Laporan status sertifikasi setiap hari Senin",
      icon: <CalendarDays size={24} className="text-primary" />,
      bg: "bg-indigo-50",
    },
    {
      key: "expired",
      label: "Peringatan Kedaluwarsa",
      desc: "Peralatan yang sertifikasinya telah kedaluwarsa",
      icon: <CheckCircle2 size={24} className="text-rose-500" />,
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden font-display px-8 lg:px-12 py-10 bg-slate-50/50">
      <div className="max-w-[1440px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-slate-900 tracking-tight text-3xl font-extrabold leading-tight">
              Pengaturan WhatsApp
            </h1>
            <p className="text-slate-500 text-sm font-semibold leading-normal">
              Kelola koneksi bot WhatsApp dan atur penerima notifikasi otomatis.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border shadow-sm ${currentStatus.bgColor} ${currentStatus.borderColor}`}
            >
              <span className="relative flex h-2.5 w-2.5">
                {status === "connecting" && (
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentStatus.color} opacity-75`}
                  ></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentStatus.color} shadow-[0_0_8px_currentColor]`}
                ></span>
              </span>
              <span className={`text-sm font-bold ${currentStatus.textColor}`}>
                {currentStatus.text}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Panel: QR Code and Status */}
          <div className="flex flex-col gap-8 w-full lg:w-[420px] shrink-0">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col min-h-[480px]">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg">
                  <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg">
                    qr_code_scanner
                  </span>
                  Koneksi Perangkat
                </h2>
              </div>
              <div className="p-8 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
                {/* Background Pattern */}
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
                    backgroundSize: "24px 24px",
                  }}
                ></div>

                {status === "open" ? (
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-100 shadow-inner group transition-all hover:scale-105">
                      <Wifi
                        size={48}
                        className="text-emerald-500 group-hover:text-emerald-600 transition-colors"
                      />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                      Terhubung Aktif
                    </h3>
                    <p className="text-slate-500 text-sm mb-10 px-4 font-medium leading-relaxed">
                      Bot WhatsApp berjalan normal. Notifikasi otomatis akan
                      dikirim sesuai jadwal.
                    </p>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 hover:border-rose-300 transition-all disabled:opacity-50 w-full justify-center shadow-sm"
                    >
                      {loggingOut ? (
                        <Loader size={18} className="animate-spin" />
                      ) : (
                        <LogOut size={18} strokeWidth={2.5} />
                      )}
                      {loggingOut
                        ? "Memutuskan Koneksi..."
                        : "Putuskan Koneksi"}
                    </button>
                  </div>
                ) : qrCode ? (
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-lg inline-block mb-6 group transition-all hover:shadow-xl hover:border-primary/30 transform hover:-translate-y-1">
                      <img
                        src={qrCode}
                        alt="WhatsApp QR Code"
                        className="w-[260px] h-[260px]"
                      />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                      Scan QR Code
                    </h3>
                    <p className="text-slate-500 text-sm max-w-[280px] font-medium leading-relaxed">
                      Buka WhatsApp di HP Anda, pilih{" "}
                      <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        Perangkat Tertaut
                      </span>{" "}
                      lalu scan barcode ini.
                    </p>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
                      {status === "connecting" ? (
                        <RefreshCw
                          size={40}
                          className="text-primary animate-spin"
                        />
                      ) : (
                        <QrCode size={40} className="text-slate-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                      {status === "connecting"
                        ? "Memuat QR Code..."
                        : "Layanan Terhenti"}
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-[280px] font-medium leading-relaxed">
                      {status === "connecting"
                        ? qrMessage ||
                          "Sistem sedang menyiapkan koneksi WhatsApp untuk Anda."
                        : "Sesi WhatsApp telah berakhir atau dihentikan. Silakan mulai ulang layanan untuk menyambungkan perangkat."}
                    </p>

                    {status === "disconnected" && (
                      <button
                        onClick={handleReconnect}
                        disabled={connectingService}
                        className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 shadow-sm shadow-primary/20"
                      >
                        {connectingService ? (
                          <Loader size={18} className="animate-spin" />
                        ) : (
                          <RefreshCw size={18} />
                        )}
                        Mulai Ulang Layanan
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Log Notifikasi */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[380px]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-primary">
                    history_toggle_off
                  </span>
                  Log Pengiriman
                </h2>
                <button
                  onClick={fetchLogs}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/30 shadow-sm transition-all focus:outline-none"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-4 shadow-inner">
                      <span className="material-symbols-outlined text-[28px] text-slate-400">
                        speaker_notes_off
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-500">
                      Belum ada aktivitas
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Sistem belum mengirim notifikasi apapun.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {logs.slice(0, 15).map((log) => (
                      <div
                        key={log._id}
                        className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 transition-colors group shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white shadow-sm ${log.status === "sent" ? "bg-emerald-500" : "bg-rose-500"}`}
                            ></span>
                            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                              {log.type.replace(/_/g, " ")}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                            {new Date(log.createdAt).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pl-4.5 bg-slate-50/50 rounded-lg p-2 border border-slate-100 mt-2">
                          <span className="text-xs text-slate-600 font-mono font-bold">
                            To: {log.recipient}
                          </span>
                          {log.error && (
                            <span
                              className="text-[10px] text-rose-600 font-semibold truncate max-w-[140px] bg-rose-50 px-2 py-0.5 rounded border border-rose-100"
                              title={log.error}
                            >
                              Err: {log.error}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Configuration */}
          <div className="flex-1 flex flex-col gap-6 w-full lg:max-w-[70%]">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-slate-900">
                  Konfigurasi Pesan Otomatis
                </h2>
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                {/* Alerts */}
                {settingsResult && (
                  <div
                    className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 shadow-sm border ${settingsResult.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}
                  >
                    <div className="bg-white p-1.5 rounded-full shadow-sm">
                      {settingsResult.type === "success" ? (
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      ) : (
                        <AlertTriangle size={18} className="text-rose-600" />
                      )}
                    </div>
                    {settingsResult.text}
                  </div>
                )}
                {testResult && (
                  <div
                    className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 shadow-sm border ${testResult.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}
                  >
                    <div className="bg-white p-1.5 rounded-full shadow-sm">
                      {testResult.type === "success" ? (
                        <CheckCircle2 size={18} className="text-emerald-600" />
                      ) : (
                        <AlertTriangle size={18} className="text-rose-600" />
                      )}
                    </div>
                    {testResult.text}
                  </div>
                )}

                {/* Recipients Section */}
                <div className="bg-slate-50/80 rounded-2xl p-6 md:p-8 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-1">
                        <GroupsIcon size={20} className="text-primary" />
                        Daftar Penerima Notifikasi
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">
                        Masukkan nomor WhatsApp tim terkait (Format: 628...)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 shadow-sm shrink-0">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      {settings?.recipients?.length || 0} Nomor Aktif
                    </div>
                  </div>

                  <div className="flex gap-3 mb-6 relative">
                    <div className="relative flex-1 group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] group-focus-within:text-primary transition-colors">
                        call
                      </span>
                      <input
                        type="text"
                        value={newRecipient}
                        onChange={(e) => setNewRecipient(e.target.value)}
                        placeholder="Ketik nomor HP (contoh: 628123456789)"
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addRecipient())
                        }
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all shadow-sm hover:border-slate-300"
                      />
                    </div>
                    <button
                      onClick={addRecipient}
                      disabled={!newRecipient.trim()}
                      className="px-6 py-3.5 bg-primary text-white rounded-xl hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-md shadow-primary/20 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        person_add
                      </span>{" "}
                      Tambah
                    </button>
                  </div>

                  {settings?.recipients?.length > 0 ? (
                    <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-inner min-h-[80px]">
                      {settings.recipients.map((r) => (
                        <div
                          key={r}
                          className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-all group"
                        >
                          <span className="text-sm font-mono font-bold text-slate-700">
                            +{r}
                          </span>
                          <button
                            onClick={() => removeRecipient(r)}
                            className="text-slate-400 hover:text-white hover:bg-rose-500 rounded p-1 transition-colors focus:outline-none"
                            title="Hapus"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 bg-white border-2 border-slate-200 border-dashed rounded-xl text-center flex flex-col items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-[32px] mb-2">
                        contacts
                      </span>
                      <p className="text-sm font-bold">
                        Daftar penerima masih kosong.
                      </p>
                      <p className="text-xs mt-1">
                        Tambahkan nomor untuk mulai menerima update otomatis.
                      </p>
                    </div>
                  )}
                </div>

                {/* Notification Rules & Toggles */}
                <div className="flex flex-col gap-6">
                  <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      rule
                    </span>
                    Aturan Notifikasi
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {notifTypes.map(({ key, label, desc, icon, bg }) => {
                      const isActive = settings?.enabledTypes?.[key];
                      return (
                        <div
                          key={key}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border ${isActive ? "border-primary/40 bg-blue-50/30 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"} transition-all cursor-pointer group relative overflow-hidden`}
                          onClick={() => toggleType(key)}
                        >
                          {isActive && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl"></div>
                          )}
                          <div className="flex items-start sm:items-center gap-5 relative z-10 w-full">
                            <div
                              className={`p-3.5 rounded-xl shrink-0 border shadow-sm ${isActive ? "bg-white border-primary/20" : `${bg} border-transparent`}`}
                            >
                              {icon}
                            </div>
                            <div className="flex-1">
                              <p className="text-base font-extrabold text-slate-900 mb-1 flex justify-between items-center w-full">
                                {label}
                                {/* Mobile Toggle */}
                                <button className="shrink-0 focus:outline-none sm:hidden">
                                  {isActive ? (
                                    <ToggleRight
                                      size={32}
                                      className="text-primary"
                                    />
                                  ) : (
                                    <ToggleLeft
                                      size={32}
                                      className="text-slate-300"
                                    />
                                  )}
                                </button>
                              </p>
                              <p className="text-sm text-slate-500 font-medium">
                                {desc}
                              </p>

                              {key === "expiringSoon" && isActive && (
                                <div
                                  className="mt-4 flex flex-wrap items-center gap-2 bg-white px-4 py-3 rounded-xl border border-primary/10 shadow-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="text-sm font-bold text-slate-700">
                                    Kirim peringatan pada
                                  </span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={90}
                                    value={settings?.expiringDays || 30}
                                    onChange={(e) =>
                                      setSettings({
                                        ...settings,
                                        expiringDays:
                                          parseInt(e.target.value) || 30,
                                      })
                                    }
                                    className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center text-primary focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all shadow-inner"
                                  />
                                  <span className="text-sm font-bold text-slate-700">
                                    hari sebelum kedaluwarsa
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Desktop Toggle */}
                          <button className="shrink-0 focus:outline-none hidden sm:block pl-6">
                            {isActive ? (
                              <ToggleRight
                                size={44}
                                className="text-primary drop-shadow-sm"
                              />
                            ) : (
                              <ToggleLeft
                                size={44}
                                className="text-slate-300"
                              />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-8 py-6 bg-slate-50/80 border-t border-slate-200 mt-auto flex items-center justify-end gap-4 flex-wrap">
                {/* Test with Minutes */}
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                  <span className="text-sm font-bold text-slate-600">Test:</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={testMinutes}
                    onChange={(e) => setTestMinutes(parseInt(e.target.value) || 5)}
                    className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-center text-primary focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-all shadow-inner"
                  />
                  <span className="text-sm font-bold text-slate-600">menit</span>
                  <button
                    onClick={testNotificationWithMinutes}
                    disabled={testingMinutesNotif || status !== "open"}
                    className="ml-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-bold hover:bg-amber-100 hover:border-amber-300 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Test dengan data yang akan expired dalam X menit"
                  >
                    {testingMinutesNotif ? (
                      <Loader size={16} className="animate-spin text-amber-600" />
                    ) : (
                      <PlayCircle size={16} className="text-amber-600" />
                    )}
                    Kirim Test
                  </button>
                </div>

                <button
                  onClick={testNotification}
                  disabled={testingNotif || status !== "open"}
                  className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingNotif ? (
                    <Loader size={18} className="animate-spin text-primary" />
                  ) : (
                    <PlayCircle size={18} className="text-emerald-500" />
                  )}
                  Uji Notifikasi
                </button>
                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 shadow-md shadow-primary/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                  {savingSettings ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">
                      save
                    </span>
                  )}
                  Simpan Konfigurasi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp;
