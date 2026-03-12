import React, { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Trash2, Loader, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { apiFetch } from "../utils/api";

const Settings = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState(null);
  const [deletingName, setDeletingName] = useState(null);

  const showResult = (type, text) => {
    setResult({ type, text });
    setTimeout(() => setResult(null), 3500);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiFetch("/categories");
      const data = await res.json();
      if (data.status === "success") setCategories(data.data);
    } catch {
      showResult("error", "Gagal memuat data kategori.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    setAdding(true);
    try {
      const res = await apiFetch("/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setCategories(data.data);
        setNewCategory("");
        showResult("success", "Kategori berhasil ditambahkan!");
      } else {
        showResult("error", data.message || "Gagal menambahkan kategori.");
      }
    } catch {
      showResult("error", "Gagal menghubungi server.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Hapus kategori "${name}"?`)) return;
    setDeletingName(name);
    try {
      const res = await apiFetch(`/categories/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status === "success") {
        setCategories(data.data);
        showResult("success", `Kategori "${name}" dihapus.`);
      } else {
        showResult("error", data.message || "Gagal menghapus.");
      }
    } catch {
      showResult("error", "Gagal menghubungi server.");
    } finally {
      setDeletingName(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden font-display px-8 lg:px-12 py-10 bg-slate-50/50">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Pengaturan Sistem
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Kelola konfigurasi dan data master aplikasi.
          </p>
        </div>

        {/* Kategori Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="px-7 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#00a1d1]/10 text-[#00a1d1]">
                <Tag size={20} />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-800 text-base">Kategori Sertifikasi</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Daftar kategori yang tersedia di form input sertifikasi
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#00a1d1]"></span>
              {categories.length} Kategori
            </span>
          </div>

          <div className="p-7 flex flex-col gap-6">
            {/* Alert */}
            {result && (
              <div
                className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-semibold shadow-sm ${
                  result.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                <div className="bg-white p-1 rounded-full shadow-sm shrink-0">
                  {result.type === "success" ? (
                    <CheckCircle size={16} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={16} className="text-rose-600" />
                  )}
                </div>
                {result.text}
              </div>
            )}

            {/* Add Form */}
            <form onSubmit={handleAdd} className="flex gap-3">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Tag size={16} className="text-slate-400 group-focus-within:text-[#00a1d1] transition-colors" />
                </div>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nama kategori baru..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00a1d1] focus:ring-[3px] focus:ring-[#00a1d1]/10 hover:border-slate-300 transition-all shadow-sm"
                />
              </div>
              <button
                type="submit"
                disabled={adding || !newCategory.trim()}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#00a1d1' }}
              >
                {adding ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} strokeWidth={3} />
                )}
                Tambah
              </button>
            </form>

            {/* Category List */}
            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400 gap-3">
                <Loader size={22} className="animate-spin" />
                <span className="text-sm font-semibold">Memuat kategori...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                  <Tag size={24} />
                </div>
                <p className="text-sm font-bold text-slate-500">Belum ada kategori</p>
                <p className="text-xs text-slate-400">Tambahkan kategori pertama di atas.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-5 py-3.5 bg-white hover:bg-slate-50/70 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[#00a1d1] shrink-0"></span>
                      <span className="text-sm font-semibold text-slate-700">{cat}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={deletingName === cat}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all disabled:opacity-50"
                      title="Hapus kategori"
                    >
                      {deletingName === cat ? (
                        <Loader size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <RotateCcw size={12} />
              Perubahan kategori langsung berlaku pada formulir Sertifikasi Baru dan Ubah Data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
