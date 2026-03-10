import React, { useState, useEffect, useCallback } from "react";
import {
  Wifi,
  WifiOff,
  Loader,
  Send,
  LogOut,
  RefreshCw,
  MessageSquare,
  Phone,
  QrCode,
  Bell,
  Plus,
  X,
  Settings,
  PlayCircle,
  Clock,
  UserPlus,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api/v1";
const WA_API = `${API_BASE}/whatsapp`;
const NOTIF_API = `${API_BASE}/notifications`;

const WhatsApp = () => {
  // Connection state
  const [status, setStatus] = useState("disconnected");
  const [qrCode, setQrCode] = useState(null);
  const [qrMessage, setQrMessage] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Send message state
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

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

  // Notification logs
  const [logs, setLogs] = useState([]);

  // Fetch WhatsApp status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${WA_API}/status`);
      const data = await res.json();
      setStatus(data.data.connectionStatus);
    } catch {
      setStatus("disconnected");
    }
  }, []);

  // Fetch QR code
  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch(`${WA_API}/qr`);
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
      const res = await fetch(`${NOTIF_API}/settings`);
      const data = await res.json();
      if (data.status === "success" && data.data) setSettings(data.data);
    } catch {
      /* keep defaults */
    }
  }, []);

  // Fetch notification logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${NOTIF_API}/log`);
      const data = await res.json();
      if (data.status === "success") setLogs(data.data);
    } catch {
      /* ignore */
    }
  }, []);

  // Poll status/QR every 3 seconds, fetch settings & logs on mount
  useEffect(() => {
    fetchStatus();
    fetchQR();
    fetchSettings();
    fetchLogs();
    const interval = setInterval(() => {
      fetchStatus();
      if (status !== "open") fetchQR();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchQR, fetchSettings, fetchLogs, status]);

  // Send manual message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!phone || !message) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`${WA_API}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setSendResult({ type: "success", text: "Pesan berhasil dikirim!" });
        setTimeout(() => setSendResult(null), 4000);
        setMessage("");
      } else {
        setSendResult({
          type: "error",
          text: data.message || "Gagal mengirim pesan",
        });
        setTimeout(() => setSendResult(null), 4000);
      }
    } catch {
      setSendResult({
        type: "error",
        text: "Gagal mengirim pesan. Periksa koneksi server.",
      });
      setTimeout(() => setSendResult(null), 4000);
    } finally {
      setSending(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(`${WA_API}/logout`, { method: "POST" });
      setStatus("disconnected");
      setQrCode(null);
      setSendResult(null);
    } catch {
      /* ignore */
    } finally {
      setLoggingOut(false);
    }
  };

  // Add recipient
  const addRecipient = () => {
    if (!newRecipient || !settings) return;
    const cleaned = newRecipient.replace(/[\s\-\+\(\)]/g, "");
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
      const res = await fetch(`${NOTIF_API}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`${NOTIF_API}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const statusConfig = {
    open: {
      color: "bg-emerald-500",
      text: "Terhubung",
      textColor: "text-emerald-700",
      bgColor: "bg-emerald-50",
      icon: Wifi,
    },
    connecting: {
      color: "bg-amber-500",
      text: "Menghubungkan...",
      textColor: "text-amber-700",
      bgColor: "bg-amber-50",
      icon: Loader,
    },
    disconnected: {
      color: "bg-slate-400",
      text: "Tidak Terhubung",
      textColor: "text-slate-600",
      bgColor: "bg-slate-100",
      icon: WifiOff,
    },
  };
  const currentStatus = statusConfig[status] || statusConfig.disconnected;
  const StatusIcon = currentStatus.icon;

  const notifTypes = [
    {
      key: "expiringSoon",
      label: "Expired Bentar Lagi",
      desc: "Sertifikasi yang akan expired dalam beberapa hari",
      icon: "⚠️",
    },
    {
      key: "weeklyCheck",
      label: "Cek Mingguan",
      desc: "Ringkasan mingguan setiap hari Senin",
      icon: "📋",
    },
    {
      key: "expired",
      label: "Expired Berakhir",
      desc: "Sertifikasi yang sudah expired",
      icon: "🔴",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare size={32} className="text-emerald-600" />
            WhatsApp
          </h1>
          <p className="text-slate-500 mt-1">
            Kelola koneksi WhatsApp dan notifikasi sertifikasi
          </p>
        </div>
        <div
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full ${currentStatus.bgColor} ${currentStatus.textColor} font-semibold text-sm`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {status === "connecting" && (
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${currentStatus.color} opacity-75`}
              ></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentStatus.color}`}
            ></span>
          </span>
          <StatusIcon
            size={16}
            className={status === "connecting" ? "animate-spin" : ""}
          />
          {currentStatus.text}
        </div>
      </header>

      {/* Row 1: QR Code + Notification Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* QR Code Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <QrCode size={20} className="text-slate-600" />
            <h2 className="font-semibold text-slate-900">Koneksi QR Code</h2>
          </div>
          <div className="p-6 flex flex-col items-center justify-center min-h-[340px]">
            {status === "open" ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wifi size={36} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  WhatsApp Terhubung!
                </h3>
                <p className="text-slate-500 text-sm mb-6">
                  Sesi aktif. Notifikasi otomatis berjalan.
                </p>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 mx-auto"
                >
                  {loggingOut ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <LogOut size={16} />
                  )}
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            ) : qrCode ? (
              <div className="text-center">
                <div className="bg-white p-3 rounded-xl border-2 border-slate-200 inline-block mb-4 shadow-sm">
                  <img
                    src={qrCode}
                    alt="WhatsApp QR Code"
                    className="w-[260px] h-[260px]"
                  />
                </div>
                <p className="text-slate-600 text-sm font-medium">
                  Scan QR code ini dengan WhatsApp di HP kamu
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  WhatsApp → Menu → Perangkat Tertaut → Tautkan Perangkat
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {status === "connecting" ? (
                    <RefreshCw
                      size={32}
                      className="text-slate-400 animate-spin"
                    />
                  ) : (
                    <QrCode size={32} className="text-slate-400" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-1">
                  {status === "connecting"
                    ? "Menunggu QR Code..."
                    : "WhatsApp Tidak Terhubung"}
                </h3>
                <p className="text-slate-500 text-sm">
                  {qrMessage || "QR code akan muncul secara otomatis"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-slate-600" />
              <h2 className="font-semibold text-slate-900">
                Pengaturan Notifikasi
              </h2>
            </div>
            {settings?.recipients?.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold">
                <Phone size={11} />
                {settings.recipients.length} nomor
              </span>
            )}
          </div>
          <div className="p-6 space-y-5">
            {/* Recipients - Multi Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <UserPlus size={14} className="inline mr-1" />
                Nomor Penerima Notifikasi
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="628123456789"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addRecipient())
                  }
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm"
                />
                <button
                  onClick={addRecipient}
                  disabled={!newRecipient.trim()}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Tambahkan beberapa nomor untuk menerima notifikasi sertifikasi
              </p>
              {settings?.recipients?.length > 0 ? (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[140px] overflow-y-auto">
                  {settings.recipients.map((r, idx) => (
                    <div
                      key={r}
                      className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          {idx + 1}
                        </span>
                        <Phone size={13} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {r}
                        </span>
                      </div>
                      <button
                        onClick={() => removeRecipient(r)}
                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 bg-slate-50 rounded-lg text-center">
                  <p className="text-xs text-slate-400">
                    Belum ada nomor penerima. Tambahkan nomor di atas.
                  </p>
                </div>
              )}
            </div>

            {/* Notification types */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Jenis Notifikasi
              </label>
              <div className="space-y-2">
                {notifTypes.map(({ key, label, desc, icon }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {label}
                        </p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleType(key)}
                      className="transition-colors"
                    >
                      {settings?.enabledTypes?.[key] ? (
                        <ToggleRight size={28} className="text-emerald-600" />
                      ) : (
                        <ToggleLeft size={28} className="text-slate-300" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Expiring days */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <Clock size={14} className="inline mr-1" />
                Peringatan sebelum expired (hari)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={settings?.expiringDays || 30}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    expiringDays: parseInt(e.target.value) || 30,
                  })
                }
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm"
              />
            </div>

            {/* Save + Test buttons */}
            {settingsResult && (
              <div
                className={`px-4 py-3 rounded-lg text-sm font-medium ${settingsResult.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}
              >
                {settingsResult.text}
              </div>
            )}
            {testResult && (
              <div
                className={`px-4 py-3 rounded-lg text-sm font-medium ${testResult.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}
              >
                {testResult.text}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 transition-colors"
              >
                {savingSettings ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Settings size={16} />
                )}
                Simpan
              </button>
              <button
                onClick={testNotification}
                disabled={testingNotif || status !== "open"}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 transition-colors"
              >
                {testingNotif ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <PlayCircle size={16} />
                )}
                Test Notifikasi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Send Message + Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Message Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Send size={20} className="text-slate-600" />
            <h2 className="font-semibold text-slate-900">Kirim Pesan</h2>
          </div>
          <div className="p-6">
            {status !== "open" && (
              <div className="mb-5 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium flex items-center gap-2">
                <WifiOff size={16} />
                Hubungkan WhatsApp terlebih dahulu
              </div>
            )}
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="628123456789"
                    disabled={status !== "open"}
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Format: kode negara + nomor (tanpa +, spasi, atau -)
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Pesan
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis pesan di sini..."
                  rows={3}
                  disabled={status !== "open"}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm resize-none"
                />
              </div>
              {sendResult && (
                <div
                  className={`px-4 py-3 rounded-lg text-sm font-medium ${sendResult.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                >
                  {sendResult.text}
                </div>
              )}
              <button
                type="submit"
                disabled={status !== "open" || sending || !phone || !message}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {sending ? (
                  <>
                    <Loader size={16} className="animate-spin" /> Mengirim...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Kirim Pesan
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Notification Log */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-slate-600" />
              <h2 className="font-semibold text-slate-900">Log Notifikasi</h2>
            </div>
            <button
              onClick={fetchLogs}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                Belum ada notifikasi yang dikirim
              </div>
            ) : (
              logs.slice(0, 10).map((log) => (
                <div
                  key={log._id}
                  className="px-6 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                        log.status === "sent"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.status === "sent" ? "✓ Terkirim" : "✗ Gagal"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">
                      {log.type.replace("_", " ")}
                    </span>{" "}
                    → {log.recipient}
                  </p>
                  {log.error && (
                    <p className="text-xs text-red-500 mt-0.5">{log.error}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp;
