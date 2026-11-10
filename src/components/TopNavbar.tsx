import React from 'react';
import {
  Menu,
  ChevronRight,
  LogOut,
  Cloud,
  Download,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { useK3, GDRIVE_MAIN_FOLDER_URL } from '../context/K3Context';
import { OFFICIAL_SIDEBAR_MENUS } from '../data/menuConfig';

export const TopNavbar: React.FC = () => {
  const {
    activeModuleId,
    setActiveModuleId,
    setIsMobileSidebarOpen,
    currentUser,
    isLoggedIn,
    handleGoogleLogout,
    setIsExportModalOpen,
    setIsHospitalInfoModalOpen,
  } = useK3();

  const isRingkasan = activeModuleId === 'RINGKASAN';
  const currentMenu =
    OFFICIAL_SIDEBAR_MENUS.find((m) => m.id === activeModuleId) || OFFICIAL_SIDEBAR_MENUS[0];

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-5 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left: Mobile Toggle + Rich Breadcrumb & Active Page Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-2xs transition-colors lg:hidden"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col min-w-0 justify-center">
          {/* Breadcrumb row */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <button
              onClick={() => setActiveModuleId('RINGKASAN')}
              className="hover:text-teal-700 transition-colors"
            >
              Dashboard
            </button>
            {!isRingkasan && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="text-slate-400 hidden sm:inline">Modul K3</span>
                <ChevronRight className="h-3 w-3 text-slate-400 shrink-0 hidden sm:inline" />
                <span className="font-semibold text-teal-700 truncate">
                  {currentMenu.id}
                </span>
              </>
            )}
          </nav>

          {/* Prominent Page Title */}
          <div className="flex items-center gap-2.5 mt-0.5">
            <h1 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 tracking-tight truncate">
              {isRingkasan ? 'Ringkasan & Kepatuhan SMK3RS' : currentMenu.name}
            </h1>
            {!isRingkasan && currentMenu.checklistMapping && (
              <span className="hidden md:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/80">
                {currentMenu.checklistMapping}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls: Drive Status + Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Drive K3 Connected Status (Clickable to open official folder) */}
        <a
          href={GDRIVE_MAIN_FOLDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100/90 text-xs font-semibold text-emerald-800 shadow-2xs transition-all group"
          title="Folder Google Drive Komite K3 RS aktif terhubung. Berkas otomatis tersimpan di sini. Klik untuk membuka folder di tab baru."
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <Cloud className="h-4 w-4 text-emerald-600 group-hover:scale-105 transition-transform" />
          <span className="hidden sm:inline">Drive K3 Terhubung</span>
          <ExternalLink className="h-3 w-3 text-emerald-600 opacity-70 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Export Report Quick Action */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-all hover:border-slate-300"
          title="Ekspor Laporan Audit & Data SMK3RS"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span className="hidden md:inline">Ekspor Laporan</span>
        </button>

        {/* Hospital Info Action */}
        <button
          onClick={() => setIsHospitalInfoModalOpen(true)}
          className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-all hover:border-slate-300"
          title="Informasi RS Semen Gresik & Komite K3"
          aria-label="Informasi Rumah Sakit"
        >
          <Building2 className="h-4 w-4 text-slate-500" />
        </button>

        {/* User Account / Profile if logged in */}
        {isLoggedIn && currentUser && (
          <div className="flex items-center gap-2 pl-2 pr-2.5 h-10 rounded-xl border border-slate-200 bg-white text-xs shadow-2xs">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Google'}
                className="h-6 w-6 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white uppercase">
                {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
              </div>
            )}
            <span className="hidden lg:inline font-semibold text-slate-800 truncate max-w-[120px]">
              {currentUser.displayName || currentUser.email}
            </span>
            <button
              onClick={() => handleGoogleLogout()}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Keluar dari Akun Google"
              aria-label="Keluar dari Akun"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
