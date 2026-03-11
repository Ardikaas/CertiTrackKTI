import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Settings,
  LogOut,
  MessageSquare,
} from "lucide-react";

const Sidebar = () => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200/80 flex flex-col p-6 h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30">
      <div className="flex items-center gap-3.5 mb-10 px-2 mt-2">
        <div className="w-9 h-9 text-white rounded-md flex items-center justify-center font-bold text-lg tracking-tight shrink-0">
          <img src="/krakatau.png" alt="Krakatau Logo" />
        </div>
        <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
          CertiTrack
        </span>
      </div>

      <nav className="flex flex-col gap-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest px-4 pb-2">
            Main
          </h3>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${
                isActive
                  ? "bg-blue-50 text-primary shadow-sm border border-blue-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`}
                />
                <span>Dashboard</span>
              </>
            )}
          </NavLink>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest px-4 pb-2">
            Sertifikasi
          </h3>
          <NavLink
            to="/sertifikasi/baru"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${
                isActive
                  ? "bg-blue-50 text-primary shadow-sm border border-blue-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FilePlus
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`}
                />
                <span>Sertifikasi Baru</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/sertifikasi/data"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${
                isActive
                  ? "bg-blue-50 text-primary shadow-sm border border-blue-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FileText
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`}
                />
                <span>Data Sertifikasi</span>
              </>
            )}
          </NavLink>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest px-4 pb-2">
            Komunikasi
          </h3>
          <NavLink
            to="/whatsapp"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <MessageSquare
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors flex-shrink-0 ${isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"}`}
                />
                <span>Pengaturan WhatsApp</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-100 bg-white">
        <nav className="flex flex-col gap-1.5">
          <button className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all group border border-transparent w-full">
            <Settings
              size={20}
              className="text-slate-400 group-hover:text-slate-600 transition-colors"
            />
            <span>Settings</span>
          </button>
          <button className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-all border border-transparent w-full group">
            <LogOut
              size={20}
              className="text-rose-400 group-hover:text-rose-600 transition-colors"
            />
            <span>Logout</span>
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
