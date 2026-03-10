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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-9 h-9 text-white rounded-md flex items-center justify-center font-bold text-lg tracking-tight">
          <img src="krakatau.png" alt="Krakatau Logo" />
        </div>
        <span className="font-bold text-xl text-slate-900 tracking-tight">
          CertiTrack
        </span>
      </div>

      <nav className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 pb-2">
            Main
          </h3>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-md font-semibold text-sm transition-colors ${isActive ? "bg-blue-50 text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`
            }
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 pb-2">
            Sertifikasi
          </h3>
          <NavLink
            to="/sertifikasi/baru"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-md font-semibold text-sm transition-colors ${isActive ? "bg-blue-50 text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`
            }
          >
            <FilePlus size={20} />
            <span>Sertifikasi Baru</span>
          </NavLink>
          <NavLink
            to="/sertifikasi/data"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-md font-semibold text-sm transition-colors ${isActive ? "bg-blue-50 text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`
            }
          >
            <FileText size={20} />
            <span>Data Sertifikasi</span>
          </NavLink>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold px-3 pb-2">
            Komunikasi
          </h3>
          <NavLink
            to="/whatsapp"
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-md font-semibold text-sm transition-colors ${isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`
            }
          >
            <MessageSquare size={20} />
            <span>WhatsApp</span>
          </NavLink>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-200">
        <nav className="flex flex-col gap-1">
          <a
            href="#"
            className="flex items-center gap-3 p-3 rounded-md font-semibold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Settings size={20} />
            <span>Settings</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-3 p-3 rounded-md font-semibold text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </a>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
