import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Settings,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const activeClass = "bg-white text-[#00a1d1] shadow-sm border border-white";
const inactiveClass = "text-white hover:bg-white hover:text-[#00a1d1] border border-transparent hover:border-white";
const activeIcon = "text-[#00a1d1]";
const inactiveIcon = "text-white/70 group-hover:text-[#00a1d1]";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  return (
    <aside className="w-72 border-r flex flex-col p-6 h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-30" style={{ backgroundColor: '#00a1d1', borderColor: '#0090bb' }}>
      <div className="flex items-center gap-3.5 mb-10 px-2 mt-2">
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <img
            src="/krakatau.png"
            alt="Krakatau Logo"
            className="w-9 h-9 object-contain brightness-0 invert"
          />
        </div>
        <span className="font-extrabold text-2xl text-white tracking-tight">
          CertiTrack
        </span>
      </div>

      <nav className="flex flex-col gap-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-[11px] font-extrabold text-white/60 uppercase tracking-widest px-4 pb-2">
            Utama
          </h3>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${isActive ? activeClass : inactiveClass
              }`
            }
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors ${isActive ? activeIcon : inactiveIcon}`}
                />
                <span>Dashboard</span>
              </>
            )}
          </NavLink>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-[11px] font-extrabold text-white/60 uppercase tracking-widest px-4 pb-2">
            Sertifikasi
          </h3>
          <NavLink
            to="/sertifikasi/baru"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${isActive ? activeClass : inactiveClass
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FilePlus
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors ${isActive ? activeIcon : inactiveIcon}`}
                />
                <span>Sertifikasi Baru</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/sertifikasi/data"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${isActive ? activeClass : inactiveClass
              }`
            }
          >
            {({ isActive }) => (
              <>
                <FileText
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors ${isActive ? activeIcon : inactiveIcon}`}
                />
                <span>Data Sertifikasi</span>
              </>
            )}
          </NavLink>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-[11px] font-extrabold text-white/60 uppercase tracking-widest px-4 pb-2">
            Komunikasi
          </h3>
          <NavLink
            to="/whatsapp"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group ${isActive ? activeClass : inactiveClass
              }`
            }
          >
            {({ isActive }) => (
              <>
                <MessageSquare
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-colors flex-shrink-0 ${isActive ? activeIcon : inactiveIcon}`}
                />
                <span>Pengaturan WhatsApp</span>
              </>
            )}
          </NavLink>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-white/20" style={{ backgroundColor: '#00a1d1' }}>
        <nav className="flex flex-col gap-1.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all group border w-full ${isActive ? "bg-white text-[#00a1d1] border-white shadow-sm" : "text-white border-transparent hover:bg-white hover:text-[#00a1d1] hover:border-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Settings
                  size={20}
                  className={`transition-colors ${isActive ? "text-[#00a1d1]" : "text-white/70 group-hover:text-[#00a1d1]"}`}
                />
                <span>Pengaturan</span>
              </>
            )}
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm text-white hover:bg-white hover:text-rose-500 border border-transparent hover:border-white transition-all w-full group"
          >
            <LogOut
              size={20}
              className="text-white/70 group-hover:text-rose-500 transition-colors"
            />
            <span>Keluar</span>
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
