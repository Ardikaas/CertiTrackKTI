import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";
import {
  Search,
  Eye,
  Edit2,
  Trash2,
  Loader,
  AlertTriangle,
  X,
  File,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Plus,
  Clock,
} from "lucide-react";

const DataSertifikasi = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal States
  const [viewModal, setViewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Edit Form States
  const [formData, setFormData] = useState({});
  const [fotoFile, setFotoFile] = useState(null);
  const [dokumenFile, setDokumenFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editResult, setEditResult] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    apiFetch("/categories")
      .then((r) => r.json())
      .then((d) => { if (d.status === "success") setCategories(d.data); })
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/sertifikasi");
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
      console.error("Failed to fetch sertifikasi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus sertifikasi ini?")) return;
    try {
      const res = await apiFetch(`/sertifikasi/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.status === "success") {
        setData(data.filter((item) => item._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setViewModal(true);
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setFormData({
      namaSertifikasi: item.namaSertifikasi,
      jenisSertifikasi: item.jenisSertifikasi,
      nomorSertifikat: item.nomorSertifikat,
      tanggalTerbit: item.tanggalTerbit ? item.tanggalTerbit.split("T")[0] : "",
      tanggalExp: item.tanggalExp ? item.tanggalExp.split("T")[0] : "",
    });
    setFotoFile(null);
    setDokumenFile(null);
    setEditResult(null);
    setEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setEditResult(null);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => fd.append(key, val));
      if (fotoFile) fd.append("fotoEquipment", fotoFile);
      if (dokumenFile) fd.append("dokumenSertifikat", dokumenFile);

      const res = await apiFetch(`/sertifikasi/${selectedItem._id}`, {
        method: "PUT",
        body: fd,
      });
      const result = await res.json();
      if (result.status === "success") {
        setEditResult({ type: "success", text: "Data berhasil diperbarui!" });
        // Update local data
        setData(
          data.map((item) =>
            item._id === selectedItem._id ? result.data : item,
          ),
        );
        setTimeout(() => setEditModal(false), 1500);
      } else {
        setEditResult({
          type: "error",
          text: result.message || "Gagal memperbarui data",
        });
      }
    } catch {
      setEditResult({ type: "error", text: "Gagal menghubungi server." });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = data.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.namaSertifikasi.toLowerCase().includes(q) ||
      item.jenisSertifikasi.toLowerCase().includes(q) ||
      item.nomorSertifikat.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden font-display px-8 lg:px-12 py-10 bg-slate-50/50">
      <div className="max-w-[1200px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex min-w-72 flex-col gap-2">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900">
              Data Sertifikasi
            </h1>
            <p className="text-slate-500 text-sm font-semibold">
              Manajemen Sertifikasi Peralatan
            </p>
          </div>
          {/* Actions / Add New */}
          <div className="flex gap-3">
            <a
              href="/sertifikasi/baru"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-5 py-3 hover:bg-blue-600 transition-colors shadow-sm shadow-primary/20 font-bold text-sm border border-transparent hover:-translate-y-0.5 transform"
            >
              <Plus size={18} strokeWidth={3} />
              Tambah Data
            </a>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 mb-8 flex flex-wrap gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <label className="flex w-full h-12 items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-[3px] focus-within:ring-primary/10 focus-within:bg-white focus-within:border-primary transition-all shadow-sm hover:border-slate-300">
              <div className="text-slate-400 pl-4 pr-1 flex items-center justify-center">
                <Search size={20} />
              </div>
              <input
                className="flex-1 w-full bg-transparent border-none text-sm text-slate-800 font-medium placeholder:text-slate-400 px-3 py-2 outline-none"
                placeholder="Cari nama peralatan, jenis, atau no sertifikat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <button className="flex h-12 items-center justify-center gap-x-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2 text-sm font-bold text-slate-700 transition-colors shadow-sm outline-none">
              <span className="material-symbols-outlined text-[18px] text-slate-500">
                filter_list
              </span>
              Status: Semua
              <span className="material-symbols-outlined text-[18px] text-slate-400">
                expand_more
              </span>
            </button>
          </div>
        </div>

        {/* Quick Filters (Pills) */}
        <div className="flex gap-2.5 mb-6 px-1 flex-wrap">
          <button className="px-5 py-2 rounded-full bg-slate-800 text-white text-xs font-bold shadow-md hover:bg-slate-700 transition-all border border-slate-700">
            Semua Data
          </button>
          <button className="px-5 py-2 rounded-full bg-white text-slate-600 text-xs font-bold border border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm">
            Aktif
          </button>
          <button className="px-5 py-2 rounded-full bg-white text-slate-600 text-xs font-bold border border-slate-300 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all shadow-sm">
            Mendekati Kedaluwarsa
          </button>
          <button className="px-5 py-2 rounded-full bg-white text-slate-600 text-xs font-bold border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all shadow-sm">
            Kedaluwarsa
          </button>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full -z-0 pointer-events-none"></div>
          {loading ? (
            <div className="flex items-center justify-center py-24 relative z-10">
              <Loader size={32} className="animate-spin text-primary" />
              <span className="ml-4 font-bold text-slate-500">
                Memuat data sertifikasi...
              </span>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4 relative z-10">
              <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-5 shadow-inner">
                <Search size={36} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">
                Tidak ada data ditemukan
              </h3>
              <p className="text-sm text-slate-500 max-w-sm font-medium">
                {data.length === 0
                  ? "Belum ada data sertifikasi peralatan yang ditambahkan."
                  : "Tidak ada hasil yang cocok dengan pencarian Anda."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200">
                    <th className="px-6 py-5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest w-1/4">
                      Nama Peralatan
                    </th>
                    <th className="px-6 py-5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                      Jenis Sertifikasi
                    </th>
                    <th className="px-6 py-5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                      Tgl Terbit
                    </th>
                    <th className="px-6 py-5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                      Tgl Kedaluwarsa
                    </th>
                    <th className="px-6 py-5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest text-center">
                      Status
                    </th>
                    <th className="px-6 py-5 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-blue-50/30 transition-colors group bg-white"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary border border-blue-100 shadow-sm shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">
                              precision_manufacturing
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">
                              {item.namaSertifikasi}
                            </div>
                            <div
                              className="text-xs text-slate-500 font-mono mt-0.5 max-w-[150px] truncate"
                              title={item.nomorSertifikat}
                            >
                              No:{" "}
                              <span className="font-semibold text-slate-600">
                                {item.nomorSertifikat}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {item.jenisSertifikasi}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500">
                        {formatDate(item.tanggalTerbit)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">
                        {formatDate(item.tanggalExp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {item.status === "expired" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-rose-700 border border-rose-200 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>{" "}
                            Kedaluwarsa
                          </span>
                        ) : item.status === "expiring_soon" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-amber-700 border border-amber-200 shadow-sm">
                            <Clock size={12} className="text-amber-500" /> Sisa{" "}
                            {item.sisaHari} hari
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-emerald-700 border border-emerald-200 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{" "}
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleView(item)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-blue-50 border border-transparent hover:border-blue-100 shadow-sm transition-all"
                            title="Lihat Detail"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditClick(item)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 shadow-sm transition-all"
                            title="Ubah Data"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 shadow-sm transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredData.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-4 relative z-10">
              <div className="text-sm font-medium text-slate-500">
                Menampilkan <span className="font-bold text-slate-900">1</span>{" "}
                -{" "}
                <span className="font-bold text-slate-900">
                  {filteredData.length}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-slate-900">{data.length}</span>{" "}
                data
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors shadow-sm disabled:opacity-50"
                  disabled
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_left
                  </span>
                </button>
                <div className="flex items-center gap-1">
                  <button className="w-8 h-8 rounded-lg bg-primary text-white text-sm font-bold flex items-center justify-center shadow-md shadow-primary/20">
                    1
                  </button>
                </div>
                <button
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                  disabled
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-display transition-all">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-multiply opacity-95">
              <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary bg-blue-100 p-1.5 rounded-lg border border-blue-200 shadow-sm text-[20px]">
                  visibility
                </span>
                Detail Sertifikasi Peralatan
              </h3>
              <button
                onClick={() => setViewModal(false)}
                className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors p-2 rounded-xl outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="mb-8">
                {selectedItem.status === "expired" ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm">
                    <AlertTriangle size={18} /> Status: Kedaluwarsa
                  </div>
                ) : selectedItem.status === "expiring_soon" ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                    <Clock size={18} /> Berakhir dalam {selectedItem.sisaHari}{" "}
                    hari
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                    <CheckCircle size={18} /> Status: Aktif
                  </div>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-8 mb-8 pb-8 border-b border-slate-100">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-extrabold text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">
                      precision_manufacturing
                    </span>
                    Nama Peralatan
                  </p>
                  <p className="font-extrabold text-slate-800 text-lg">
                    {selectedItem.namaSertifikasi}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-extrabold text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">
                      category
                    </span>
                    Jenis Sertifikasi
                  </p>
                  <p className="font-bold text-slate-800 text-base">
                    {selectedItem.jenisSertifikasi}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    No. Sertifikat
                  </p>
                  <p className="font-mono text-sm font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg inline-block shadow-sm">
                    {selectedItem.nomorSertifikat}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Masa Berlaku
                  </p>
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg shadow-sm text-sm">
                      {formatDate(selectedItem.tanggalTerbit)}
                    </span>
                    <span className="text-slate-400 material-symbols-outlined text-[18px]">
                      arrow_right_alt
                    </span>
                    <span
                      className={`px-3 py-1 rounded-lg border shadow-sm text-sm ${selectedItem.status === "expired" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-100 border-slate-200"}`}
                    >
                      {formatDate(selectedItem.tanggalExp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Files Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ImageIcon size={16} className="text-primary" /> Foto
                    Peralatan
                  </p>
                  {selectedItem.fotoEquipment ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2 h-48 shadow-inner relative group">
                      <img
                        src={`http://localhost:5000${selectedItem.fotoEquipment}`}
                        alt="Peralatan"
                        className="max-h-full object-contain rounded-xl"
                      />
                      <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={`http://localhost:5000${selectedItem.fotoEquipment}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 hover:bg-slate-50 transform scale-95 group-hover:scale-100 transition-all"
                        >
                          <Eye size={14} /> Lihat Pembesaran
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                      <span className="material-symbols-outlined text-[36px] mb-2 opacity-50 bg-white p-3 rounded-full shadow-sm">
                        hide_image
                      </span>
                      <span className="text-sm font-semibold mt-2">
                        Tidak ada foto
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <File size={16} className="text-rose-500" /> Dokumen
                    Sertifikat
                  </p>
                  {selectedItem.dokumenSertifikat ? (
                    <a
                      href={`http://localhost:5000${selectedItem.dokumenSertifikat}`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-48 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 flex flex-col items-center justify-center text-primary shadow-sm hover:border-primary/50 hover:shadow-md transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full pointer-events-none"></div>
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:-translate-y-1 group-hover:shadow transition-transform z-10">
                        <File
                          size={32}
                          strokeWidth={2.5}
                          className="text-rose-500"
                        />
                      </div>
                      <span className="text-sm font-extrabold z-10 text-slate-700 group-hover:text-primary transition-colors">
                        Buka Dokumen PDF
                      </span>
                    </a>
                  ) : (
                    <div className="h-48 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                      <span className="material-symbols-outlined text-[36px] mb-2 opacity-50 bg-white p-3 rounded-full shadow-sm">
                        description
                      </span>
                      <span className="text-sm font-semibold mt-2">
                        Tidak ada dokumen
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewModal(false)}
                className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors shadow-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-display transition-all">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 scale-100 animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-blend-multiply opacity-95">
              <h3 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary bg-blue-100 p-1.5 rounded-lg border border-blue-200 shadow-sm text-[20px]">
                  edit_document
                </span>
                Ubah Data Sertifikasi Peralatan
              </h3>
              <button
                onClick={() => setEditModal(false)}
                className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors p-2 rounded-xl outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              {editResult && (
                <div
                  className={`mb-6 p-4 rounded-xl shadow-sm flex items-center gap-3 border font-semibold ${editResult.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}
                >
                  <div className="bg-white p-1 rounded-full shadow-sm shrink-0">
                    {editResult.type === "success" ? (
                      <CheckCircle size={20} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={20} className="text-red-600" />
                    )}
                  </div>
                  <span className="text-sm">{editResult.text}</span>
                </div>
              )}

              <form
                id="editForm"
                onSubmit={handleUpdate}
                className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6"
              >
                <div className="col-span-1 md:col-span-2 group">
                  <label className="block text-sm font-bold text-slate-700 transition-colors mb-2">
                    Nama Peralatan
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaSertifikasi}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        namaSertifikasi: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all font-semibold hover:border-slate-300 shadow-sm"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 transition-colors mb-2">
                    Jenis Sertifikasi
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.jenisSertifikasi}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jenisSertifikasi: e.target.value,
                        })
                      }
                      className="w-full appearance-none px-4 py-3 pr-10 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all font-semibold cursor-pointer hover:border-slate-300 shadow-sm"
                    >
                      <option value="">Pilih jenis...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 transition-colors mb-2">
                    No. Sertifikat
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nomorSertifikat}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nomorSertifikat: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all font-mono font-bold uppercase hover:border-slate-300 shadow-sm"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 transition-colors mb-2">
                    Tanggal Terbit
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors">
                      <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary text-[18px] transition-colors">
                        calendar_today
                      </span>
                    </div>
                    <input
                      type="date"
                      required
                      value={formData.tanggalTerbit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tanggalTerbit: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all font-semibold hover:border-slate-300 shadow-sm"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-bold text-slate-700 transition-colors mb-2">
                    Tanggal Kedaluwarsa
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors">
                      <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary text-[18px] transition-colors">
                        event
                      </span>
                    </div>
                    <input
                      type="date"
                      required
                      value={formData.tanggalExp}
                      onChange={(e) =>
                        setFormData({ ...formData, tanggalExp: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:bg-white focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-all font-semibold hover:border-slate-300 shadow-sm"
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 pt-6 border-t border-slate-100 mt-2">
                  <h4 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      attachment
                    </span>{" "}
                    Perbarui File Lampiran{" "}
                    <span className="text-[11px] text-slate-400 font-semibold ml-1 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      Opsional
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Foto Upload */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                        Foto Peralatan
                      </label>
                      <label className="relative flex items-center justify-center w-full min-h-[64px] px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-white hover:border-primary/50 cursor-pointer transition-all shadow-sm group">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFotoFile(e.target.files[0])}
                          className="hidden"
                        />
                        <div className="flex items-center gap-3 w-full">
                          <div className="p-2.5 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 group-hover:text-primary transition-colors shrink-0 group-hover:scale-105 group-hover:border-primary/20">
                            <ImageIcon size={18} />
                          </div>
                          <span className="text-sm font-semibold text-slate-600 truncate group-hover:text-slate-900 transition-colors">
                            {fotoFile
                              ? fotoFile.name
                              : selectedItem.fotoEquipment
                                ? "Ubah foto saat ini..."
                                : "Pilih file gambar baru..."}
                          </span>
                        </div>
                      </label>
                    </div>

                    {/* Dokumen Upload */}
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">
                        Dokumen Sertifikat (PDF)
                      </label>
                      <label className="relative flex items-center justify-center w-full min-h-[64px] px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-white hover:border-primary/50 cursor-pointer transition-all shadow-sm group">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => setDokumenFile(e.target.files[0])}
                          className="hidden"
                        />
                        <div className="flex items-center gap-3 w-full">
                          <div className="p-2.5 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 group-hover:text-rose-500 transition-colors shrink-0 group-hover:scale-105 group-hover:border-rose-200">
                            <File size={18} />
                          </div>
                          <span className="text-sm font-semibold text-slate-600 truncate group-hover:text-slate-900 transition-colors">
                            {dokumenFile
                              ? dokumenFile.name
                              : selectedItem.dokumenSertifikat
                                ? "Ubah dokumen PDF..."
                                : "Pilih file PDF..."}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm focus:outline-none"
                disabled={submitting}
              >
                Batal
              </button>
              <button
                form="editForm"
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-all shadow-md shadow-primary/20 flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                {submitting ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]">
                    save
                  </span>
                )}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSertifikasi;
