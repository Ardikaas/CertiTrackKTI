import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Activity,
  CheckCircle,
  Clock,
  XCircle,
  ShieldAlert,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api/v1";

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterType, setFilterType] = useState("tahun");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/sertifikasi`);
        const result = await res.json();
        if (result.status === "success") {
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

  // Compute stat totals
  const total = data.length;
  const expired = data.filter((d) => d.status === "expired").length;
  const expiringSoon = data.filter((d) => d.status === "expiring_soon").length;
  const aktif = data.filter(
    (d) => d.status === "aktif" || d.sisaHari > 30,
  ).length;

  const urgentItems = data
    .filter((d) => d.status === "expired" || d.status === "expiring_soon")
    .sort((a, b) => a.sisaHari - b.sisaHari);

  // Compute Trend Data
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
  };
  const currentWeekStart = getWeekStart(new Date());

  let trendData = [];
  if (filterType === "minggu") {
    trendData = [
      { label: "Sen", activated: 0, expired: 0 },
      { label: "Sel", activated: 0, expired: 0 },
      { label: "Rab", activated: 0, expired: 0 },
      { label: "Kam", activated: 0, expired: 0 },
      { label: "Jum", activated: 0, expired: 0 },
      { label: "Sab", activated: 0, expired: 0 },
      { label: "Min", activated: 0, expired: 0 },
    ];
  } else if (filterType === "bulan") {
    trendData = [
      { label: "Mg 1", activated: 0, expired: 0 },
      { label: "Mg 2", activated: 0, expired: 0 },
      { label: "Mg 3", activated: 0, expired: 0 },
      { label: "Mg 4", activated: 0, expired: 0 },
      { label: "Mg 5", activated: 0, expired: 0 },
    ];
  } else {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Ags",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    trendData = months.map((m) => ({ label: m, activated: 0, expired: 0 }));
  }

  let newCertThisPeriod = 0;

  data.forEach((item) => {
    // Process Aktivasi
    if (item.tanggalTerbit) {
      const d = new Date(item.tanggalTerbit);
      if (filterType === "tahun" && d.getFullYear() === currentYear) {
        trendData[d.getMonth()].activated++;
        newCertThisPeriod++;
      } else if (
        filterType === "bulan" &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      ) {
        const weekIndex = Math.min(Math.floor((d.getDate() - 1) / 7), 4);
        trendData[weekIndex].activated++;
        newCertThisPeriod++;
      } else if (
        filterType === "minggu" &&
        getWeekStart(d) === currentWeekStart
      ) {
        const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
        trendData[dayIndex].activated++;
        newCertThisPeriod++;
      }
    }
    // Process Expired
    if (item.tanggalExp) {
      const d = new Date(item.tanggalExp);
      if (filterType === "tahun" && d.getFullYear() === currentYear) {
        trendData[d.getMonth()].expired++;
      } else if (
        filterType === "bulan" &&
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth
      ) {
        const weekIndex = Math.min(Math.floor((d.getDate() - 1) / 7), 4);
        trendData[weekIndex].expired++;
      } else if (
        filterType === "minggu" &&
        getWeekStart(d) === currentWeekStart
      ) {
        const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
        trendData[dayIndex].expired++;
      }
    }
  });

  const maxChartVal = Math.max(
    1,
    ...trendData.map((t) => Math.max(t.activated, t.expired)),
  );

  const periodLabel =
    filterType === "tahun"
      ? "Tahun Ini"
      : filterType === "bulan"
        ? "Bulan Ini"
        : "Minggu Ini";

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden font-display bg-slate-50/50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200/80 px-8 py-4 bg-white/80 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">
            Overview
          </h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative max-w-md w-full hidden md:block group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">
                search
              </span>
            </div>
            <input
              className="block w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/80 text-sm placeholder-slate-400 focus:bg-white focus:ring-[3px] focus:ring-primary/10 focus:border-primary outline-none transition-all hover:border-slate-300 shadow-sm"
              placeholder="Search equipment, certifications..."
              type="text"
            />
          </div>
          <button className="relative p-2.5 text-slate-400 hover:text-primary bg-slate-50 hover:bg-blue-50 border border-slate-200/60 rounded-full transition-all shadow-sm">
            <span className="material-symbols-outlined text-[22px]">
              notifications
            </span>
            {urgentItems.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-slate-200 cursor-pointer shadow-sm hover:border-primary/50 transition-colors"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB36Ua8ww0D0yF9uWi89i8ZviJmmjGOqoKOCFEXvVsQ6uXDDKk3xMc8uZsfiVn60sl9QJmhdkqb5nUtEbqO-8jJn4I_ubdUHETGgD_Lg8zER9Y5Q-s9JoHAp1DKzEjFVo5DHF_SOd8MK5kUq_lg0RrlLTumCZVW8iTg06MHhfA4Mh-X-C0_440ObWyqpwhuekum4Pom3gq38MJN0R1sqSDIyEufVEPzEIoZK7FBih2pAusyzGx4r3HM71t0Vr2eF5ykdQ5hV79HJz0c")',
            }}
          ></div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-bl-full -z-0"></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 border border-blue-100 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">construction</span>
              </div>
              <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200 shadow-sm">
                <span className="material-symbols-outlined text-[14px] mr-1">
                  trending_up
                </span>{" "}
                12%
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold relative z-10">
              Total Peralatan
            </h3>
            <p className="text-3xl font-extrabold text-slate-800 mt-1 relative z-10 tracking-tight">
              {loading ? "..." : total}
            </p>
          </div>

          {/* Card 2: Valid */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-bl-full -z-0"></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200 shadow-sm">
                <span className="material-symbols-outlined text-[14px] mr-1">
                  trending_flat
                </span>{" "}
                95%
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold relative z-10">
              Status Aman
            </h3>
            <p className="text-3xl font-extrabold text-slate-800 mt-1 relative z-10 tracking-tight">
              {loading ? "..." : aktif}
            </p>
          </div>

          {/* Card 3: Expiring Soon */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/5 to-transparent rounded-bl-full -z-0"></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-100 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">
                  hourglass_empty
                </span>
              </div>
              <span className="flex items-center text-xs font-bold text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-full border border-rose-200 shadow-sm">
                <span className="material-symbols-outlined text-[14px] mr-1">
                  warning
                </span>
                Siaga
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold relative z-10">
              Akan Berakhir (30h)
            </h3>
            <p className="text-3xl font-extrabold text-amber-600 mt-1 relative z-10 tracking-tight">
              {loading ? "..." : expiringSoon}
            </p>
          </div>

          {/* Card 4: Revoked/Expired */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/5 to-transparent rounded-bl-full -z-0"></div>
            <div className="relative z-10 flex justify-between items-start mb-4">
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 border border-rose-100 shadow-sm group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">cancel</span>
              </div>
              <span className="flex items-center text-xs font-bold text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-full border border-rose-200 shadow-sm">
                <span className="material-symbols-outlined text-[14px] mr-1">
                  trending_down
                </span>{" "}
                2%
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold relative z-10">
              Sudah Expired
            </h3>
            <p className="text-3xl font-extrabold text-rose-600 mt-1 relative z-10 tracking-tight">
              {loading ? "..." : expired}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Certifications Table (Spans 2 columns) */}
          <div className="xl:col-span-2 flex flex-col rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-800">
                Perhatian Khusus
              </h3>
              <Link
                to="/sertifikasi/data"
                className="text-sm font-bold text-primary hover:text-blue-700 transition-colors flex items-center gap-1"
              >
                Lihat Semua <ArrowRight size={16} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              {!loading && urgentItems.length === 0 ? (
                <div className="p-16 text-center text-slate-400 bg-white">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 mb-5 shadow-inner border border-emerald-100">
                    <CheckCircle size={40} />
                  </div>
                  <p className="text-xl font-bold text-slate-800 mb-2">
                    Semua Sertifikasi Aman
                  </p>
                  <p className="text-sm text-slate-500">
                    Tidak ada peralatan yang expired atau mendekati masa
                    tenggang.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-widest font-bold border-b border-slate-100">
                      <th className="px-6 py-4">Nama Peralatan</th>
                      <th className="px-6 py-4">Sertifikasi</th>
                      <th className="px-6 py-4">Tgl Expired</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {urgentItems.slice(0, 5).map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm shrink-0">
                              <span className="material-symbols-outlined">
                                precision_manufacturing
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-800 group-hover:text-primary transition-colors">
                                {item.namaSertifikasi}
                              </p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                No:{" "}
                                <span className="font-mono">
                                  {item.nomorSertifikat}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-700">
                            {item.jenisSertifikasi}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p
                            className={`text-sm font-bold ${item.status === "expired" ? "text-rose-600" : "text-amber-600"}`}
                          >
                            {formatDate(item.tanggalExp)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              item.status === "expired"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${item.status === "expired" ? "bg-rose-500 animate-pulse" : "bg-amber-500"}`}
                            ></span>
                            {item.status === "expired"
                              ? "Expired"
                              : "Expiring Soon"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to="/sertifikasi/data"
                            className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-all"
                          >
                            <ArrowRight size={18} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Trends / Chart Area */}
          <div className="flex flex-col rounded-2xl bg-white border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -z-0"></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <h3 className="text-lg font-extrabold text-slate-800">
                Trend Aktivasi vs Expired
              </h3>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="form-select text-xs py-1.5 pl-3 pr-8 border border-slate-200 rounded-lg bg-white shadow-sm text-slate-600 font-bold focus:ring-[3px] focus:ring-primary/10 focus:border-primary outline-none cursor-pointer"
              >
                <option value="tahun">Tahun Ini</option>
                <option value="bulan">Bulan Ini</option>
                <option value="minggu">Minggu Ini</option>
              </select>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mb-4 z-10 relative">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary border border-blue-600 shadow-sm"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Aktivasi
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 border border-rose-500 shadow-sm"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Expired
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-end relative h-52 mt-2 z-10 border-b border-slate-200">
              {/* Dynamic Chart Representation */}
              <div className="absolute inset-0 flex items-end justify-between px-1 gap-1 sm:gap-2">
                {trendData.map((d, idx) => {
                  const activatedHeight = (d.activated / maxChartVal) * 100;
                  const expiredHeight = (d.expired / maxChartVal) * 100;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex items-end justify-center h-full gap-[2px] sm:gap-1 group/month"
                    >
                      {/* Activated Bar */}
                      <div
                        className="w-full max-w-[14px] sm:max-w-[20px] bg-primary rounded-t-sm relative group/bar transition-all hover:brightness-110 shadow-sm border border-blue-600 border-b-0 cursor-pointer flex flex-col justify-end"
                        style={{ height: `${Math.max(2, activatedHeight)}%` }}
                      >
                        <div className="hidden group-hover/bar:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg z-20 whitespace-nowrap">
                          {d.label}: {d.activated} Baru
                        </div>
                      </div>

                      {/* Expired Bar */}
                      <div
                        className="w-full max-w-[14px] sm:max-w-[20px] bg-rose-400 rounded-t-sm relative group/bar transition-all hover:brightness-110 shadow-sm border border-rose-500 border-b-0 cursor-pointer flex flex-col justify-end"
                        style={{ height: `${Math.max(2, expiredHeight)}%` }}
                      >
                        <div className="hidden group-hover/bar:block absolute -top-8 left-1/2 -translate-x-1/2 bg-rose-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg z-20 whitespace-nowrap">
                          {d.label}: {d.expired} Exp
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* X Axis Labels */}
            <div className="flex justify-between text-[10px] sm:text-[11px] font-bold text-slate-400 mt-2 px-1 pb-2">
              {trendData.map((d, idx) => (
                <span key={idx} className="flex-1 text-center truncate">
                  {d.label}
                </span>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 relative z-10">
              <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Sertifikasi Baru
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-3xl font-extrabold text-slate-800 tracking-tight">
                      +{newCertThisPeriod}
                    </p>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                      {periodLabel}
                    </span>
                  </div>
                </div>
                <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary shadow-sm border border-blue-100">
                  <span className="material-symbols-outlined text-[24px]">
                    analytics
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
