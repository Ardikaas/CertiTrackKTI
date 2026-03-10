import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldAlert,
  Loader,
  ArrowRight,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api/v1";

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/sertifikasi`);
        const result = await res.json();
        if (result.status === "success") {
          // Add derived status property
          const enrichedData = result.data.map((d) => ({
            ...d,
            status:
              d.sisaHari <= 0
                ? "expired"
                : d.sisaHari <= 30
                  ? "expiring_soon"
                  : "aktif",
          }));
          setData(enrichedData);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute stats
  const total = data.length;
  const expired = data.filter((d) => d.status === "expired").length;
  const expiringSoon = data.filter((d) => d.status === "expiring_soon").length;
  const aktif = data.filter(
    (d) => d.status === "aktif" || d.sisaHari > 30,
  ).length; // Fallback if API status is not strict

  // Items needing attention (expired + expiring soon)
  const urgentItems = data
    .filter((d) => d.status === "expired" || d.status === "expiring_soon")
    .sort((a, b) => a.sisaHari - b.sisaHari);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-32">
        <Loader size={32} className="animate-spin text-primary" />
        <span className="ml-3 text-slate-500 font-medium">
          Memuat dashboard...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-slate-500">
          Ringkasan status sertifikasi peralatan dan peringatan jatuh tempo.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Total Peralatan
            </p>
            <h2 className="text-3xl font-bold text-slate-900">{total}</h2>
          </div>
        </div>

        {/* Aman Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Status Aman
            </p>
            <h2 className="text-3xl font-bold text-slate-900">{aktif}</h2>
          </div>
        </div>

        {/* Expiring Card */}
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10 blur-xl"></div>
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Akan Berakhir
            </p>
            <h2 className="text-3xl font-bold text-amber-600">
              {expiringSoon}
            </h2>
          </div>
        </div>

        {/* Expired Card */}
        <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm flex items-center gap-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-10 blur-xl"></div>
          <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <XCircle size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Sudah Expired
            </p>
            <h2 className="text-3xl font-bold text-red-600">{expired}</h2>
          </div>
        </div>
      </div>

      {/* Urgent Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 text-red-500 rounded-lg">
              <ShieldAlert size={20} />
            </div>
            <h3 className="font-bold text-lg text-slate-800">
              Perhatian Khusus
            </h3>
          </div>
          <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            {urgentItems.length} item membutuhkan tindakan
          </span>
        </div>

        {urgentItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mb-4">
              <CheckCircle size={32} />
            </div>
            <p className="font-medium text-slate-900 mb-1">
              Semua Sertifikasi Aman
            </p>
            <p className="text-sm">
              Tidak ada peralatan yang expired atau mendekati masa tenggang.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {urgentItems.map((item) => (
              <div
                key={item._id}
                className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors ${
                  item.status === "expired"
                    ? "border-l-4 border-l-red-500 -ml-[1px]"
                    : "border-l-4 border-l-amber-500 -ml-[1px]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-bold text-slate-900 text-lg">
                      {item.namaSertifikasi}
                    </h4>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === "expired"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.status === "expired" ? "Expired" : "Expiring Soon"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">
                    {item.jenisSertifikasi} • No:{" "}
                    <span className="font-mono">{item.nomorSertifikat}</span>
                  </p>
                  <p className="text-xs font-medium text-slate-600">
                    Masa Berlaku: {formatDate(item.tanggalTerbit)} —{" "}
                    <span
                      className={
                        item.status === "expired"
                          ? "text-red-600 font-bold"
                          : "text-amber-600 font-bold"
                      }
                    >
                      {formatDate(item.tanggalExp)}
                    </span>
                  </p>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 text-right">
                  <div
                    className={
                      item.status === "expired"
                        ? "text-red-500 font-bold text-lg"
                        : "text-amber-500 font-bold text-lg"
                    }
                  >
                    {item.status === "expired" ? (
                      <span>Lewat {Math.abs(item.sisaHari)} Hari</span>
                    ) : (
                      <span>Sisa {item.sisaHari} Hari</span>
                    )}
                  </div>
                  <a
                    href="/data"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-blue-700 transition-colors"
                  >
                    Lihat Detail <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
