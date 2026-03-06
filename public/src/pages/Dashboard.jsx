import React from 'react';
import { Search, AlertTriangle, Eye, AlertCircle } from 'lucide-react';

const Dashboard = () => {
    const equipment = [
        { id: 1, name: 'Penyalur petir', status: 'warning' },
        { id: 2, name: 'Tanki timbun', status: 'ok' },
        { id: 3, name: 'Instalasi listrik', status: 'ok' },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">Dashboard</h1>

                <div className="flex items-center gap-4">
                    <div className="relative w-72">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Genset"
                            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm"
                        />
                    </div>
                    <button className="text-amber-500 hover:bg-amber-50 p-2 rounded-lg transition-colors">
                        <AlertCircle size={24} />
                    </button>
                </div>
            </header>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {equipment.map(item => (
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col" key={item.id}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900 m-0">{item.name}</h3>
                            {item.status === 'warning' && (
                                <div className="flex items-center justify-center text-amber-500">
                                    <AlertTriangle size={24} />
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-4">
                            <button className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold text-sm border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors">
                                <Eye size={16} />
                                <span>View</span>
                            </button>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
};

export default Dashboard;
