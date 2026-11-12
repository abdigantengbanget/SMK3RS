import React from 'react';
import {
  LayoutDashboard,
  Shield,
  FlaskConical,
  Flame,
  Wrench,
  Stethoscope,
  AlertTriangle,
  HeartPulse,
  GraduationCap,
  Users2,
  FileText,
  BarChart3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useK3 } from '../context/K3Context';
import { OFFICIAL_SIDEBAR_MENUS } from '../data/menuConfig';
import { MenuItem } from '../types/k3';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ShieldAlert: Shield,
  Biohazard: FlaskConical,
  Flame,
  Wrench,
  Stethoscope,
  AlertTriangle,
  HeartPulse,
  GraduationCap,
  Users2,
  FileText,
  BarChart3,
  ExternalLink,
};

export const Sidebar: React.FC = () => {
  const {
    activeModuleId,
    setActiveModuleId,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    moduleSummaries,
    stats,
  } = useK3();

  const handleMenuClick = (menu: MenuItem, e: React.MouseEvent) => {
    if (menu.isExternal) {
      return;
    }

    e.preventDefault();
    setActiveModuleId(menu.id);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element (Clean White Light Theme) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200 text-slate-700 transition-all duration-300 ease-in-out lg:static lg:h-screen lg:shrink-0 lg:overflow-hidden select-none ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        } ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        aria-label="Navigasi Utama Dashboard K3RS"
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Hospital Emblem Logo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-2xs p-1 overflow-hidden">
              <img
                src="/assets/aistudio/rs-semen-gresik_d7d14617_d7d14617.png"
                alt="Logo RS Semen Gresik"
                className="h-full w-full object-contain"
              />
            </div>

            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-black uppercase tracking-wider text-teal-700">
                  SMK3RS
                </span>
                <span className="text-sm font-extrabold text-slate-900 leading-tight truncate">
                  RS Semen Gresik
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
            aria-label="Tutup Menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List - Exact 13 items in official order */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <div className="mb-2 px-3">
            {!isSidebarCollapsed ? (
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                MENU UTAMA
              </span>
            ) : (
              <div className="h-px bg-slate-200 my-1" />
            )}
          </div>

          <nav className="space-y-1">
            {OFFICIAL_SIDEBAR_MENUS.map((menu, index) => {
              const Icon = ICON_MAP[menu.iconName] || LayoutDashboard;
              const isActive = activeModuleId === menu.id;

              return (
                <div key={menu.id} className="relative group">
                  <a
                    href={menu.isExternal ? menu.externalUrl : menu.path}
                    onClick={(e) => handleMenuClick(menu, e)}
                    target={menu.isExternal ? '_blank' : undefined}
                    rel={menu.isExternal ? 'noopener noreferrer' : undefined}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200/60 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {/* Outlined Icon */}
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-teal-700' : 'text-slate-500 group-hover:text-slate-700'
                      }`}
                    />

                    {/* Menu Name */}
                    {!isSidebarCollapsed && (
                      <span className="truncate flex-1 text-left">
                        {menu.name}
                      </span>
                    )}

                    {!isSidebarCollapsed && (
                      menu.isExternal ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 flex items-center gap-1 shrink-0">
                          <span>Eksternal</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      ) : menu.id === 'RINGKASAN' ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-100/70 text-teal-800 shrink-0">
                          {stats.totalItems} butir
                        </span>
                      ) : (
                        (() => {
                          const summary = moduleSummaries.find((s) => s.moduleId === menu.id);
                          if (!summary) return null;
                          const isDone = summary.uploadedCount > 0;
                          return (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 transition-colors ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {summary.uploadedCount}/{summary.totalItems}
                            </span>
                          );
                        })()
                      )
                    )}
                  </a>

                  {/* Tooltip for Collapsed Sidebar */}
                  {isSidebarCollapsed && (
                    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex flex-col z-50 min-w-[200px] rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-xl">
                      <div className="flex items-center justify-between gap-2 font-bold text-teal-400">
                        <span>{index + 1}. {menu.name}</span>
                        {menu.isExternal && <ExternalLink className="h-3 w-3 inline" />}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Collapse Toggle */}
        <div className="shrink-0 p-3.5 border-t border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed ? (
              <div className="flex flex-col text-[11px] text-slate-400 leading-tight">
                <span className="font-semibold text-slate-600">Akreditasi KARS</span>
                <span className="text-teal-600 font-medium">Standar MFK & STARKES</span>
              </div>
            ) : null}

            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title={isSidebarCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
              aria-label={isSidebarCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
