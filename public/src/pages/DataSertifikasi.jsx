import React from 'react';
import { Search, Eye, Edit2, Trash2 } from 'lucide-react';

const DataSertifikasi = () => {
    const dummyData = [
        { id: 1, namaJenis: 'Penyalur petir', tglTerbit: '2023-01-15', tglExp: '2025-01-15', noSertifikat: 'CERT-001' },
        { id: 2, namaJenis: 'Tanki timbun', tglTerbit: '2023-05-10', tglExp: '2026-05-10', noSertifikat: 'CERT-002' },
        { id: 3, namaJenis: 'Instalasi listrik', tglTerbit: '2024-02-20', tglExp: '2025-02-20', noSertifikat: 'CERT-003' },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <header className="flex justify-between items-end mb-8">
                <h1 className="text-3xl font-bold">Data Sertifikasi</h1>

                <div className="relative w-72">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari sertifikasi..."
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                    />
                </div>
            </header>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                <th className="py-4 px-6">No</th>
                                <th className="py-4 px-6">Nama Jenis</th>
                                <th className="py-4 px-6">Tanggal Terbit</th>
                                <th className="py-4 px-6">Tanggal Expired</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dummyData.map((item, index) => (
                                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0 text-sm">
                                    <td className="py-4 px-6">{index + 1}</td>
                                    <td className="py-4 px-6 font-semibold text-slate-900">{item.namaJenis}</td>
                                    <td className="py-4 px-6 text-slate-600">{item.tglTerbit}</td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${isExpiringSoon(item.tglExp) ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                            {item.tglExp}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-1.5 text-primary hover:bg-blue-50 rounded-md transition-colors" title="Detail">
                                                <Eye size={18} />
                                            </button>
                                            <button className="p-1.5 text-primary hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                                                <Edit2 size={18} />
                                            </button>
                                            <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Helper function for dummy data status validation
const isExpiringSoon = (dateString) => {
    if (dateString.includes('2025')) return true;
    return false;
};

export default DataSertifikasi;
