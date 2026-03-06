import React, { useState } from 'react';
import { UploadCloud, Send } from 'lucide-react';

const SertifikasiForm = () => {
    const [formData, setFormData] = useState({
        namaSertifikasi: '',
        jenisSertifikasi: '',
        nomorSertifikat: '',
        tanggalTerbit: '',
        tanggalExp: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting:", formData);
        alert('Sertifikasi berhasil dikirim!');
    };

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Input Sertifikasi</h1>
                <p className="text-slate-500 text-sm">Masukkan data sertifikasi peralatan dengan benar.</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

                        <div className="lg:col-span-3 flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-900">Nama sertifikasi / Equipment</label>
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
                                    <label className="text-sm font-semibold text-slate-900">Jenis Sertifikasi</label>
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
                                    <label className="text-sm font-semibold text-slate-900">Nomor sertifikat</label>
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
                                    <label className="text-sm font-semibold text-slate-900">Tanggal terbit</label>
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
                                    <label className="text-sm font-semibold text-slate-900">Tanggal expired</label>
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

                        <div className="lg:col-span-2 flex flex-col h-full">
                            <label className="text-sm font-semibold text-slate-900 mb-2">Foto Equipment</label>
                            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:border-primary hover:bg-blue-50/50 transition-all relative min-h-[250px] text-center p-8">
                                <UploadCloud size={48} className="text-primary mb-4" />
                                <h4 className="text-base font-semibold text-slate-900 mb-2">Klik atau Drag & Drop foto di sini</h4>
                                <p className="text-sm text-slate-500">Format JPG, PNG (Max. 5MB)</p>
                                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end border-t border-slate-200 mt-8 pt-6">
                        <button type="submit" className="min-w-[160px] flex items-center justify-center gap-2 bg-primary hover:bg-[#0d6fe0] text-white py-3 px-6 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
                            <Send size={18} />
                            <span>Simpan & Kirim</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SertifikasiForm;
