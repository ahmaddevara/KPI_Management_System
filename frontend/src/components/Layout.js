import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, Briefcase, Target, ClipboardEdit,
  BarChart3, Trophy, Settings, LogOut, Building2, Gauge, FileSpreadsheet, UserCircle2,
  Wallet, CheckCircle2, CalendarRange
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin","supervisor","karyawan"] },
  { section: "Master Data" },
  { to: "/master/divisi", label: "Divisi", icon: Building2, roles: ["admin"] },
  { to: "/master/jabatan", label: "Jabatan", icon: Briefcase, roles: ["admin"] },
  { to: "/master/karyawan", label: "Karyawan", icon: Users, roles: ["admin"] },
  { to: "/master/kpi", label: "KPI", icon: Gauge, roles: ["admin"] },
  { section: "Perencanaan" },
  { to: "/target-kpi", label: "Target KPI", icon: Target, roles: ["admin","supervisor"] },
  { to: "/input-kpi", label: "Input KPI", icon: ClipboardEdit, roles: ["admin","supervisor"] },
  { to: "/approval", label: "Persetujuan KPI", icon: CheckCircle2, roles: ["admin"] },
  { section: "Payroll" },
  { to: "/payroll", label: "Payroll", icon: Wallet, roles: ["admin","supervisor","karyawan"] },
  { section: "Laporan" },
  { to: "/rekap/individu", label: "Rekap Individu", icon: BarChart3, roles: ["admin","supervisor","karyawan"] },
  { to: "/rekap/divisi", label: "Rekap Divisi", icon: BarChart3, roles: ["admin","supervisor"] },
  { to: "/rekap/perusahaan", label: "Rekap Perusahaan", icon: BarChart3, roles: ["admin","supervisor"] },
  { to: "/rekap/yoy", label: "Perbandingan Tahun", icon: CalendarRange, roles: ["admin","supervisor"] },
  { to: "/reward", label: "Reward & Punishment", icon: Trophy, roles: ["admin","supervisor"] },
  { section: "Admin" },
  { to: "/users", label: "User & Akses", icon: UserCircle2, roles: ["admin"] },
  { to: "/import", label: "Import Excel", icon: FileSpreadsheet, roles: ["admin"] },
  { to: "/setting", label: "Pengaturan", icon: Settings, roles: ["admin"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col" data-testid="sidebar">
        <div className="px-5 py-5 border-b border-gray-200">
          <div className="text-[10px] tracking-[0.2em] text-gray-500 uppercase">AP GROUP</div>
          <div className="heading text-lg font-semibold tracking-tight">KPI Management</div>
        </div>
        <nav className="p-3 space-y-0.5 overflow-y-auto flex-1">
          {NAV.map((n, i) => {
            if (n.section) {
              // hide section if no visible items follow
              const following = [];
              for (let j = i+1; j < NAV.length; j++) {
                if (NAV[j].section) break;
                following.push(NAV[j]);
              }
              const anyVisible = following.some(item => !item.roles || item.roles.includes(user.role));
              if (!anyVisible) return null;
              return <div key={i} className="pt-4 pb-1 px-2 text-[10px] uppercase tracking-[0.15em] text-gray-400">{n.section}</div>;
            }
            if (n.roles && !n.roles.includes(user.role)) return null;
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                data-testid={`nav-${n.to.replace(/\//g,"-") || "home"}`}
                className={({isActive}) =>
                  `flex items-center gap-2 px-2 py-2 rounded-sm text-sm ${isActive
                    ? "bg-[#111827] text-white"
                    : "text-gray-700 hover:bg-gray-100"}`
                }
              >
                <Icon size={16} strokeWidth={1.75} />
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-sm bg-[#111827] text-white flex items-center justify-center text-xs">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-[11px] uppercase tracking-wider text-gray-500">{user.role}{user.divisi ? ` · ${user.divisi}` : ""}{user.nik ? ` · ${user.nik}` : ""}</div>
            </div>
          </div>
          <button
            data-testid="logout-btn"
            onClick={async ()=>{ await logout(); nav("/login"); }}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-sm"
          >
            <LogOut size={14}/> Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="border-b border-gray-200 bg-white px-8 py-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-gray-500">Enterprise</div>
          <div className="text-sm text-gray-600">Sistem Manajemen KPI — Perhitungan Otomatis, Rekap Realtime</div>
        </div>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
