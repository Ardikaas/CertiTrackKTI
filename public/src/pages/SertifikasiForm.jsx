import React, { useState, useRef } from "react";
import {
  Send,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  X,
  UploadCloud,
} from "lucide-react";
import { Link } from "react-router-dom";

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
    if (file.size > 10 * 1024 * 1024) {
      setResult({ type: "error", text: "Ukuran dokumen maksimal 10MB" });
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden font-display px-8 lg:px-12 py-10 bg-slate-50/50">
      <div className="max-w-[1024px] mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-slate-900 tracking-tight text-3xl font-extrabold leading-tight">
            Input Sertifikasi Peralatan
          </h1>
          <p className="text-slate-500 text-sm font-medium leading-normal">
            Masukkan detail untuk menambahkan sertifikasi peralatan baru ke
            dalam sistem.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-6 sm:p-10 flex flex-col gap-8">
              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex flex-col flex-1 group">
                  <span className="text-slate-700 text-sm font-bold leading-normal mb-2 transition-colors">
                    Nama Peralatan / Mesin
                  </span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors">
                      <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary text-[20px] transition-colors">
                        precision_manufacturing
                      </span>
                    </div>
                    <input
                      name="namaSertifikasi"
                      value={formData.namaSertifikasi}
                      onChange={handleChange}
                      required
                      className="flex w-full min-w-0 flex-1 rounded-xl text-slate-900 focus:bg-white focus:ring-[3px] focus:ring-primary/10 focus:border-primary border border-slate-200 bg-slate-50 h-12 placeholder:text-slate-400 pl-11 pr-3 text-sm font-medium transition-all outline-none hover:border-slate-300"
                      placeholder="Contoh: Genset 500KVA"
                    />
                  </div>
                </label>

                <label className="flex flex-col flex-1 group">
                  <span className="text-slate-700 text-sm font-bold leading-normal mb-2 transition-colors">
                    Kategori Sertifikasi
                  </span>
                  <div className="relative">
                    <select
                      name="jenisSertifikasi"
                      value={formData.jenisSertifikasi}
                      onChange={handleChange}
                      required
                      className="appearance-none flex w-full min-w-0 flex-1 rounded-xl text-slate-900 focus:bg-white focus:ring-[3px] focus:ring-primary/10 focus:border-primary border border-slate-200 bg-slate-50 h-12 placeholder:text-slate-400 pl-4 pr-10 text-sm font-medium transition-all outline-none cursor-pointer hover:border-slate-300"
                    >
                      <option value="">Pilih Kategori...</option>
                      <option value="Sertifikasi Instalasi Listrik">
                        Instalasi Listrik
                      </option>
                      <option value="Sertifikasi Instalasi Penyalur Petir">
                        Instalasi Penyalur Petir
                      </option>
                      <option value="Sertifikasi Pesawat Tenaga Produksi">
                        Pesawat Tenaga Produksi
                      </option>
                      <option value="Sertifikasi Pesawat Angkat Angkut">
                        Pesawat Angkat Angkut
                      </option>
                      <option value="Sertifikasi Lift">Instalasi Lift</option>
                      <option value="Sertifikasi Bejana Tekan">
                        Bejana Tekan
                      </option>
                      <option value="Sertifikasi Pemadam Kebakaran">
                        Pemadam Kebakaran
                      </option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors">
                      expand_more
                    </span>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <label className="flex flex-col flex-1 group">
                  <span className="text-slate-700 text-sm font-bold leading-normal mb-2 transition-colors">
                    No. Sertifikat
                  </span>
                  <input
                    type="text"
                    name="nomorSertifikat"
                    value={formData.nomorSertifikat}
                    onChange={handleChange}
                    required
                    className="flex w-full min-w-0 flex-1 rounded-xl text-slate-900 focus:bg-white focus:ring-[3px] focus:ring-primary/10 focus:border-primary border border-slate-200 bg-slate-50 h-12 placeholder:text-slate-400 px-4 text-sm font-mono font-bold transition-all outline-none uppercase hover:border-slate-300"
                    placeholder="CERT-12345"
                  />
                </label>

                <label className="flex flex-col flex-1 group">
                  <span className="text-slate-700 text-sm font-bold leading-normal mb-2 transition-colors">
                    Tanggal Terbit
                  </span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors">
                      <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary text-[18px] transition-colors">
                        calendar_today
                      </span>
                    </div>
                    <input
                      type="date"
                      name="tanggalTerbit"
                      value={formData.tanggalTerbit}
                      onChange={handleChange}
                      required
                      className="flex w-full min-w-0 flex-1 rounded-xl text-slate-900 focus:bg-white focus:ring-[3px] focus:ring-primary/10 focus:border-primary border border-slate-200 bg-slate-50 h-12 placeholder:text-slate-400 pl-11 pr-3 text-sm font-medium transition-all outline-none hover:border-slate-300"
                    />
                  </div>
                </label>

                <label className="flex flex-col flex-1 group">
                  <span className="text-slate-700 text-sm font-bold leading-normal mb-2 transition-colors">
                    Tanggal Berakhir
                  </span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors">
                      <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary text-[18px] transition-colors">
                        event
                      </span>
                    </div>
                    <input
                      type="date"
                      name="tanggalExp"
                      value={formData.tanggalExp}
                      onChange={handleChange}
                      required
                      className="flex w-full min-w-0 flex-1 rounded-xl text-slate-900 focus:bg-white focus:ring-[3px] focus:ring-primary/10 focus:border-primary border border-slate-200 bg-slate-50 h-12 placeholder:text-slate-400 pl-11 pr-3 text-sm font-medium transition-all outline-none hover:border-slate-300"
                    />
                  </div>
                </label>
              </div>

              {/* Enhanced File Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                {/* Image Upload */}
                <div className="flex flex-col mt-2">
                  <span className="text-slate-700 text-sm font-bold leading-normal mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-50 text-primary flex items-center justify-center">
                      <ImageIcon size={14} />
                    </div>
                    Foto Peralatan
                  </span>

                  {fotoPreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-[220px] group shadow-inner">
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <button
                          type="button"
                          onClick={removeFoto}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 rounded-lg text-sm font-bold shadow-lg hover:bg-slate-50 transition-colors transform scale-95 group-hover:scale-100"
                        >
                          <X size={16} /> Ganti Foto
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-3 py-2 flex items-center justify-between border-t border-slate-100">
                        <span className="text-xs font-semibold text-slate-700 truncate pr-2">
                          {fotoFile?.name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {formatFileSize(fotoFile?.size || 0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fotoInputRef.current?.click()}
                      className="h-[220px] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-blue-50/50 hover:border-primary/40 transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 group-hover:scale-105 group-hover:shadow transition-all group-hover:border-primary/20">
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-[28px] transition-colors">
                          add_photo_alternate
                        </span>
                      </div>
                      <h3 className="text-slate-700 text-sm font-bold mb-1 group-hover:text-primary transition-colors">
                        Pilih Foto Peralatan
                      </h3>
                      <p className="text-slate-400 text-xs px-6 font-medium">
                        Format JPG, PNG (Maksimal 5MB)
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

                {/* PDF Upload */}
                <div className="flex flex-col mt-2">
                  <span className="text-slate-700 text-sm font-bold leading-normal mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-50 text-primary flex items-center justify-center">
                      <FileText size={14} />
                    </div>
                    Dokumen Sertifikat (PDF)
                  </span>

                  {dokumenFile ? (
                    <div className="relative rounded-2xl border border-slate-200 bg-slate-50 h-[220px] shadow-sm flex flex-col items-center justify-center group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100/50"></div>
                      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-slate-200 z-10 transition-transform group-hover:scale-105 group-hover:shadow">
                        <FileText
                          size={36}
                          className="text-red-500"
                          strokeWidth={2}
                        />
                      </div>
                      <p className="text-sm font-bold text-slate-800 max-w-[80%] text-center truncate z-10 relative px-4">
                        {dokumenName}
                      </p>
                      <div className="flex gap-2 mt-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={removeDokumen}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 rounded-lg text-xs font-semibold shadow-sm transition-all hover:bg-red-50"
                        >
                          <X size={14} /> Ganti File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => dokumenInputRef.current?.click()}
                      className="h-[220px] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-blue-50/50 hover:border-primary/40 transition-all cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm border border-slate-100 group-hover:scale-105 group-hover:shadow transition-all group-hover:border-primary/20">
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-primary text-[28px] transition-colors">
                          upload_file
                        </span>
                      </div>
                      <h3 className="text-slate-700 text-sm font-bold mb-1 group-hover:text-primary transition-colors">
                        Unggah Dokumen Sertifikat
                      </h3>
                      <p className="text-slate-400 text-xs px-6 font-medium">
                        Format PDF (Maksimal 10MB)
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

              {/* Feedback Result */}
              {result && (
                <div
                  className={`mt-2 p-4 rounded-xl flex items-center gap-3 shadow-sm font-medium border ${result.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}
                >
                  <div
                    className={`p-1.5 rounded-full bg-white/80 shrink-0 shadow-sm`}
                  >
                    {result.type === "success" ? (
                      <CheckCircle size={18} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={18} className="text-red-600" />
                    )}
                  </div>
                  <span className="text-sm">{result.text}</span>
                </div>
              )}
            </div>

            {/* Footer Form Actions */}
            <div className="px-6 sm:px-10 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-2xl">
              <Link
                to="/sertifikasi/data"
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-colors focus:outline-none"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="min-w-[160px] px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-blue-600 shadow-sm shadow-primary/30 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {submitting ? (
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    refresh
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">
                    save
                  </span>
                )}
                <span>{submitting ? "Menyimpan..." : "Simpan Data"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SertifikasiForm;
