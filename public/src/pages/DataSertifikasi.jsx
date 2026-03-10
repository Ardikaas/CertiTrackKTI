import React, { useState, useEffect } from "react";
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
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api/v1";

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

  const fetchData = async () => {
    setLoading(true);
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
      const res = await fetch(`${API_BASE}/sertifikasi/${id}`, {
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

      const res = await fetch(`${API_BASE}/sertifikasi/${selectedItem._id}`, {
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

  const getStatusBadge = (item) => {
    if (item.status === "expired") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
          <AlertTriangle size={12} /> Expired
        </span>
      );
    }
    if (item.status === "expiring_soon") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          ⚠️ {item.sisaHari} hari lagi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
        ✓ Aktif
      </span>
    );
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
    <div className="max-w-7xl mx-auto">
      <header className="flex justify-between items-end mb-8">
        <h1 className="text-3xl font-bold">Data Sertifikasi</h1>

        <div className="relative w-72">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Cari sertifikasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
          />
        </div>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader size={24} className="animate-spin text-slate-400" />
            <span className="ml-2 text-slate-500">Memuat data...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            {data.length === 0
              ? "Belum ada data sertifikasi."
              : "Tidak ada hasil pencarian."}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold whitespace-nowrap">
                  <th className="py-4 px-6 w-16">No</th>
                  <th className="py-4 px-6">Nama / Jenis</th>
                  <th className="py-4 px-6">No. Sertifikat</th>
                  <th className="py-4 px-6">Tanggal Terbit</th>
                  <th className="py-4 px-6">Tanggal Expired</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0 text-sm"
                  >
                    <td className="py-4 px-6 text-slate-500">{index + 1}</td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">
                        {item.namaSertifikasi}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.jenisSertifikasi}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-xs whitespace-nowrap">
                      {item.nomorSertifikat}
                    </td>
                    <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                      {formatDate(item.tanggalTerbit)}
                    </td>
                    <td className="py-4 px-6 text-slate-600 whitespace-nowrap">
                      {formatDate(item.tanggalExp)}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {getStatusBadge(item)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(item)}
                          className="p-1.5 text-primary hover:bg-blue-50 rounded-md transition-colors"
                          title="Detail"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 text-primary hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">
                Detail Sertifikasi
              </h3>
              <button
                onClick={() => setViewModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Badge Status */}
              <div className="mb-6">{getStatusBadge(selectedItem)}</div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Peralatan
                  </p>
                  <p className="font-medium text-slate-900">
                    {selectedItem.namaSertifikasi}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Jenis
                  </p>
                  <p className="font-medium text-slate-900">
                    {selectedItem.jenisSertifikasi}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    No. Sertifikat
                  </p>
                  <p className="font-mono text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded inline-block">
                    {selectedItem.nomorSertifikat}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Masa Berlaku
                  </p>
                  <p className="font-medium text-slate-900">
                    {formatDate(selectedItem.tanggalTerbit)} —{" "}
                    {formatDate(selectedItem.tanggalExp)}
                  </p>
                </div>
              </div>

              {/* Files */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Foto Peralatan
                  </p>
                  {selectedItem.fotoEquipment ? (
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                      <img
                        src={`http://localhost:5000${selectedItem.fotoEquipment}`}
                        alt="Peralatan"
                        className="max-h-48 object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="h-32 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                      <ImageIcon size={24} className="mb-2 opacity-50" />
                      <span className="text-xs font-medium">
                        Tidak ada foto
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Dokumen Sertifikat
                  </p>
                  {selectedItem.dokumenSertifikat ? (
                    <a
                      href={`http://localhost:5000${selectedItem.dokumenSertifikat}`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-32 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-primary hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <File size={24} />
                      </div>
                      <span className="text-sm font-semibold">
                        Lihat PDF Sertifikat
                      </span>
                    </a>
                  ) : (
                    <div className="h-32 rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                      <File size={24} className="mb-2 opacity-50" />
                      <span className="text-xs font-medium">
                        Tidak ada dokumen
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setViewModal(false)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">
                Edit Sertifikasi
              </h3>
              <button
                onClick={() => setEditModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {editResult && (
                <div
                  className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${editResult.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}
                >
                  {editResult.type === "success" ? (
                    <CheckCircle size={20} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={20} className="text-red-600" />
                  )}
                  <span className="font-medium text-sm">{editResult.text}</span>
                </div>
              )}

              <form
                id="editForm"
                onSubmit={handleUpdate}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Jenis Sertifikasi
                  </label>
                  <select
                    required
                    value={formData.jenisSertifikasi}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jenisSertifikasi: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  >
                    <option value="">Pilih jenis...</option>
                    <option value="Sertifikasi Instalasi Listrik">
                      Sertifikasi Instalasi Listrik
                    </option>
                    <option value="Sertifikasi Instalasi Penyalur Petir">
                      Sertifikasi Instalasi Penyalur Petir
                    </option>
                    <option value="Sertifikasi Pesawat Tenaga Produksi">
                      Sertifikasi Pesawat Tenaga Produksi
                    </option>
                    <option value="Sertifikasi Pesawat Angkat Angkut">
                      Sertifikasi Pesawat Angkat Angkut
                    </option>
                    <option value="Sertifikasi Lift">Sertifikasi Lift</option>
                    <option value="Sertifikasi Bejana Tekan">
                      Sertifikasi Bejana Tekan
                    </option>
                    <option value="Sertifikasi Pemadam Kebakaran">
                      Sertifikasi Pemadam Kebakaran
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
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
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tanggal Terbit
                  </label>
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
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Tanggal Expired
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.tanggalExp}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggalExp: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  />
                </div>

                {/* Uploads (Opstional) */}
                <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100 mt-2">
                  <p className="text-sm font-semibold text-slate-900 mb-3">
                    Update File (Opsional)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Foto Peralatan
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFotoFile(e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 group-hover:bg-slate-100 transition-colors">
                          <ImageIcon size={18} className="text-slate-400" />
                          <span className="text-sm text-slate-600 truncate flex-1">
                            {fotoFile
                              ? fotoFile.name
                              : selectedItem.fotoEquipment
                                ? "Ganti foto..."
                                : "Upload foto Baru..."}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Dokumen (PDF)
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => setDokumenFile(e.target.files[0])}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 group-hover:bg-slate-100 transition-colors">
                          <File size={18} className="text-slate-400" />
                          <span className="text-sm text-slate-600 truncate flex-1">
                            {dokumenFile
                              ? dokumenFile.name
                              : selectedItem.dokumenSertifikat
                                ? "Ganti dokumen..."
                                : "Upload dokumen baru..."}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors"
                disabled={submitting}
              >
                Batal
              </button>
              <button
                form="editForm"
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
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
