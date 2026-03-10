import React, { useState, useRef } from "react";
import {
  Send,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api/v1";

const SertifikasiForm = () => {
  const [formData, setFormData] = useState({
    namaSertifikasi: "",
    jenisSertifikasi: "",
    nomorSertifikat: "",
    tanggalTerbit: "",
    tanggalExp: "",
  });
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [dokumenFile, setDokumenFile] = useState(null);
  const [dokumenName, setDokumenName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const fotoInputRef = useRef(null);
  const dokumenInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setResult({ type: "error", text: "Ukuran foto maksimal 5MB" });
      return;
    }
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setFotoPreview(ev.target.result);
    reader.readAsDataURL(file);
    setResult(null);
  };

  const handleDokumenChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setResult({ type: "error", text: "Ukuran dokumen maksimal 5MB" });
      return;
    }
    setDokumenFile(file);
    setDokumenName(file.name);
    setResult(null);
  };

  const removeFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
    if (fotoInputRef.current) fotoInputRef.current.value = "";
  };

  const removeDokumen = () => {
    setDokumenFile(null);
    setDokumenName("");
    if (dokumenInputRef.current) dokumenInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => fd.append(key, val));
      if (fotoFile) fd.append("fotoEquipment", fotoFile);
      if (dokumenFile) fd.append("dokumenSertifikat", dokumenFile);

      const res = await fetch(`${API_BASE}/sertifikasi`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.status === "success") {
        setResult({ type: "success", text: "Sertifikasi berhasil disimpan!" });
        setFormData({
          namaSertifikasi: "",
          jenisSertifikasi: "",
          nomorSertifikat: "",
          tanggalTerbit: "",
          tanggalExp: "",
        });
        removeFoto();
        removeDokumen();
      } else {
        setResult({
          type: "error",
          text: data.message || "Gagal menyimpan sertifikasi",
        });
      }
    } catch {
      setResult({
        type: "error",
        text: "Gagal menghubungi server. Pastikan server berjalan.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Input Sertifikasi</h1>
        <p className="text-slate-500 text-sm">
          Masukkan data sertifikasi peralatan dengan benar.
        </p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Left: Text fields */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900">
                  Nama sertifikasi / Equipment
                </label>
                <input
                  type="text"
                  name="namaSertifikasi"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                  placeholder="e.g. Penyalur petir"
                  value={formData.namaSertifikasi}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-900">
                    Jenis Sertifikasi
                  </label>
                  <input
                    type="text"
                    name="jenisSertifikasi"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                    placeholder="e.g. Listrik"
                    value={formData.jenisSertifikasi}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-900">
                    Nomor sertifikat
                  </label>
                  <input
                    type="text"
                    name="nomorSertifikat"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                    placeholder="CERT-12345"
                    value={formData.nomorSertifikat}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-900">
                    Tanggal terbit
                  </label>
                  <input
                    type="date"
                    name="tanggalTerbit"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                    value={formData.tanggalTerbit}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-900">
                    Tanggal expired
                  </label>
                  <input
                    type="date"
                    name="tanggalExp"
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                    value={formData.tanggalExp}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Right: File uploads */}
            <div className="lg:col-span-2 flex flex-col gap-6 h-full">
              {/* Foto Equipment */}
              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-slate-900 mb-2">
                  Foto Equipment
                </label>
                {fotoPreview ? (
                  <div className="flex-1 relative rounded-xl overflow-hidden border-2 border-primary/30 bg-slate-50 min-h-[160px] group">
                    <img
                      src={fotoPreview}
                      alt="Preview foto"
                      className="w-full h-full object-cover min-h-[160px] max-h-[220px]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={removeFoto}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/90 text-red-600 rounded-lg text-sm font-semibold shadow-lg hover:bg-white transition-colors"
                      >
                        <X size={14} /> Hapus
                      </button>
                    </div>
                    {/* File info bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-3 py-2 flex items-center gap-2 border-t border-slate-200">
                      <ImageIcon size={14} className="text-primary" />
                      <span className="text-xs font-medium text-slate-700 truncate flex-1">
                        {fotoFile?.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatFileSize(fotoFile?.size || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:border-primary hover:bg-blue-50/50 transition-all relative min-h-[160px] text-center p-4"
                    onClick={() => fotoInputRef.current?.click()}
                  >
                    <ImageIcon size={32} className="text-primary mb-2" />
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">
                      Klik atau Drag & Drop foto di sini
                    </h4>
                    <p className="text-xs text-slate-500">
                      Format JPG, PNG (Max. 5MB)
                    </p>
                    <input
                      ref={fotoInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFotoChange}
                    />
                  </div>
                )}
              </div>

              {/* Dokumen Sertifikat */}
              <div className="flex flex-col flex-1">
                <label className="text-sm font-semibold text-slate-900 mb-2">
                  Dokumen Sertifikat
                </label>
                {dokumenFile ? (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-primary/30 rounded-xl bg-blue-50/50 relative min-h-[160px] p-4">
                    <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                      <FileText size={32} className="text-red-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-0.5 text-center truncate max-w-full px-4">
                      {dokumenName}
                    </p>
                    <p className="text-xs text-slate-500 mb-3">
                      {formatFileSize(dokumenFile.size)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={removeDokumen}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white text-red-600 rounded-lg text-xs font-semibold border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        <X size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:border-primary hover:bg-blue-50/50 transition-all relative min-h-[160px] text-center p-4"
                    onClick={() => dokumenInputRef.current?.click()}
                  >
                    <FileText size={32} className="text-primary mb-2" />
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">
                      Klik atau Drag & Drop PDF di sini
                    </h4>
                    <p className="text-xs text-slate-500">
                      Format PDF (Max. 5MB)
                    </p>
                    <input
                      ref={dokumenInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleDokumenChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {result && (
            <div
              className={`mt-6 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${result.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}
            >
              {result.type === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {result.text}
            </div>
          )}

          <div className="flex justify-end border-t border-slate-200 mt-8 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="min-w-[160px] flex items-center justify-center gap-2 bg-primary hover:bg-[#0d6fe0] text-white py-3 px-6 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Send size={18} />
              <span>{submitting ? "Menyimpan..." : "Simpan & Kirim"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SertifikasiForm;
