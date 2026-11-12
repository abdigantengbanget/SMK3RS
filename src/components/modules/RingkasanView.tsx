import React, { useState } from "react";
import {
  Copy,
  FileCheck2,
  ShieldAlert,
  Clock,
  ArrowUpRight,
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
  Search,
} from "lucide-react";
import { useK3 } from "../../context/K3Context";
import { OFFICIAL_SIDEBAR_MENUS } from "../../data/menuConfig";

const MODULE_ICON_MAP: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    bg: string;
    text: string;
  }
> = {
  "K3-KESELAMATAN": { icon: Shield, bg: "bg-teal-50", text: "text-teal-700" },
  "K3-B3": { icon: FlaskConical, bg: "bg-amber-50", text: "text-amber-700" },
  "K3-KEBAKARAN": { icon: Flame, bg: "bg-rose-50", text: "text-rose-700" },
  "K3-UTILITAS": { icon: Wrench, bg: "bg-blue-50", text: "text-blue-700" },
  "K3-ALKES": {
    icon: Stethoscope,
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
  "K3-BENCANA": {
    icon: AlertTriangle,
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  "K3-KESEHATAN-KERJA": {
    icon: HeartPulse,
    bg: "bg-red-50",
    text: "text-red-700",
  },
  "K3-DIKLAT": {
    icon: GraduationCap,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  "K3-KEPEMIMPINAN": { icon: Users2, bg: "bg-sky-50", text: "text-sky-700" },
  "K3-DOKUMEN": { icon: FileText, bg: "bg-slate-100", text: "text-slate-700" },
  "K3-LAPORAN": { icon: BarChart3, bg: "bg-cyan-50", text: "text-cyan-700" },
  "K3-RISK-REGISTER": {
    icon: ExternalLink,
    bg: "bg-teal-50",
    text: "text-teal-700",
  },
};

export const RingkasanView: React.FC = () => {
  const { stats, moduleSummaries, setActiveModuleId } = useK3();

  const [searchModule, setSearchModule] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "pending" | "completed">(
    "all",
  );

  const allModuleCards = OFFICIAL_SIDEBAR_MENUS.filter(
    (m) => m.id !== "RINGKASAN",
  );

  // Filter modules
  const filteredModules = allModuleCards.filter((menu) => {
    const summary = moduleSummaries.find((s) => s.moduleId === menu.id);
    const uploadedCount = summary?.uploadedCount || 0;
    const matchSearch =
      searchModule === "" ||
      menu.name.toLowerCase().includes(searchModule.toLowerCase()) ||
      menu.checklistMapping.toLowerCase().includes(searchModule.toLowerCase());

    if (!matchSearch) return false;

    if (filterType === "pending") {
      return uploadedCount === 0;
    }
    if (filterType === "completed") {
      return uploadedCount > 0;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: DASHBOARD / OVERVIEW & Ringkasan SMK3RS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
              DASHBOARD / OVERVIEW
            </p>
          </div>
        </div>

        {/* Floating pill badge */}
        <div className="shrink-0 self-start lg:self-auto rounded-2xl border border-teal-200/80 bg-teal-50/70 px-4 py-3 text-xs text-slate-700 shadow-2xs max-w-xs flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <div>
            <span className="font-bold text-slate-900">Data aktual</span>
            <span className="text-slate-400"> · </span>
            <span className="text-slate-600">Pembaruan otomatis</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards in 2x2 Grid with high-legibility layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Persyaratan */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Total Persyaratan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Copy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalItems}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Persyaratan pada master checklist
            </p>
          </div>
        </div>

        {/* Card 2: Sudah Ada Dokumen */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Sudah Ada Dokumen
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {stats.uploadedItemsCount}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {stats.uploadedPercentage}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {stats.uploadedPercentage}% dari 162 persyaratan
            </p>
          </div>
        </div>

        {/* Card 3: Perlu Ditindaklanjuti */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Perlu Ditindaklanjuti
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {stats.pendingItemsCount}
              </span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {stats.pendingPercentage}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Kosong atau menunggu verifikasi
            </p>
          </div>
        </div>

        {/* Card 4: Modul SMK3RS / MFK */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:shadow-xs hover:border-purple-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              Modul SMK3RS / MFK
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              12
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Termasuk Risk Register / IBR
            </p>
          </div>
        </div>
      </div>

      {/* Module Overview Section with Clean Quick Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* Quick filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                filterType === "all"
                  ? "bg-teal-600 text-white font-bold shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua Modul ({allModuleCards.length})
            </button>
            <button
              onClick={() => setFilterType("pending")}
              className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                filterType === "pending"
                  ? "bg-amber-600 text-white font-bold shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Belum Lengkap (
              {
                allModuleCards.filter(
                  (m) =>
                    (moduleSummaries.find((s) => s.moduleId === m.id)
                      ?.uploadedCount || 0) === 0,
                ).length
              }
              )
            </button>
            <button
              onClick={() => setFilterType("completed")}
              className={`px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                filterType === "completed"
                  ? "bg-emerald-600 text-white font-bold shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Ada Berkas (
              {
                allModuleCards.filter(
                  (m) =>
                    (moduleSummaries.find((s) => s.moduleId === m.id)
                      ?.uploadedCount || 0) > 0,
                ).length
              }
              )
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchModule}
              onChange={(e) => setSearchModule(e.target.value)}
              placeholder="Cari modul atau standar MFK..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Module Cards List (Pixel match to Image 2 with elevated icons & typography) */}
        <div className="space-y-3.5">
          {filteredModules.map((menu) => {
            const summary = moduleSummaries.find(
              (s) => s.moduleId === menu.id,
            ) || {
              moduleId: menu.id,
              moduleName: menu.name,
              totalItems: 0,
              uploadedCount: 0,
              pendingCount: 0,
              uploadedPercentage: 0,
              pendingPercentage: 100,
              totalDocuments: 0,
            };

            const isExternal = Boolean(menu.externalUrl);
            const iconConfig = MODULE_ICON_MAP[menu.id] || {
              icon: Shield,
              bg: "bg-teal-50",
              text: "text-teal-700",
            };
            const Icon = iconConfig.icon;

            const handleClick = () => {
              if (isExternal && menu.externalUrl) {
                window.open(menu.externalUrl, "_blank", "noopener,noreferrer");
              } else {
                setActiveModuleId(menu.id);
              }
            };

            return (
              <div
                key={menu.id}
                onClick={handleClick}
                className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Icon & Module Title */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 ${iconConfig.bg} ${iconConfig.text} transition-transform group-hover:scale-105`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                          {menu.name}
                        </h3>
                        {menu.checklistMapping && (
                          <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {menu.checklistMapping}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        <span>{summary.uploadedPercentage}% lengkap</span>
                        <span>·</span>
                        <span>{summary.totalDocuments} dokumen</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Ratio & Arrow */}
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 group-hover:text-teal-700 shrink-0">
                    <span className="tabular-nums">
                      {summary.uploadedCount}/{summary.totalItems}
                    </span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>

                {/* Full-width progress bar */}
                <div className="mt-3.5 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${summary.uploadedPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}

          {filteredModules.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-xs text-slate-400">
              Tidak ditemukan modul yang sesuai dengan pencarian "{searchModule}
              ".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
