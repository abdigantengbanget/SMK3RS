import React from "react";
import { Menu, ChevronRight } from "lucide-react";
import { useK3 } from "../context/K3Context";
import { OFFICIAL_SIDEBAR_MENUS } from "../data/menuConfig";

export const TopNavbar: React.FC = () => {
  const {
    activeModuleId,
    setActiveModuleId,
    setIsMobileSidebarOpen,
    isCloudSynced,
  } = useK3();

  const isRingkasan = activeModuleId === "RINGKASAN";
  const currentMenu =
    OFFICIAL_SIDEBAR_MENUS.find((m) => m.id === activeModuleId) ||
    OFFICIAL_SIDEBAR_MENUS[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left: Mobile Toggle + Breadcrumb & Active Page Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-2xs transition-colors lg:hidden"
          aria-label="Buka Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col min-w-0 justify-center">
          {/* Breadcrumb row */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium leading-none mb-1"
          >
            <button
              onClick={() => setActiveModuleId("RINGKASAN")}
              className="hover:text-teal-700 transition-colors"
            >
              Dashboard
            </button>
            {!isRingkasan && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                <span className="text-slate-400 hidden sm:inline">
                  Modul K3
                </span>
                <ChevronRight className="h-3 w-3 text-slate-300 shrink-0 hidden sm:inline" />
                <span className="font-semibold text-teal-700 truncate">
                  {currentMenu.id}
                </span>
              </>
            )}
          </nav>

          {/* Prominent Page Title */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate leading-tight">
              {isRingkasan
                ? "Ringkasan SMK3 RS Semen Gresik"
                : currentMenu.name}
            </h1>
            {!isRingkasan && currentMenu.checklistMapping && (
              <span className="hidden md:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/80 shrink-0">
                {currentMenu.checklistMapping}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls: Real-time Cloud Status & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Real-time Cloud Sync Badge */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl border text-[11px] font-semibold transition-colors ${
            isCloudSynced
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
          title={
            isCloudSynced
              ? "Tersinkronisasi Realtime dengan Cloud Firestore"
              : "Menghubungkan ke Cloud..."
          }
        >
          <span className="relative flex h-2 w-2">
            {isCloudSynced && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isCloudSynced ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />
          </span>
          <span className="hidden md:inline">
            {isCloudSynced ? "Realtime" : "Menghubungkan..."}
          </span>
        </div>
      </div>
    </header>
  );
};
