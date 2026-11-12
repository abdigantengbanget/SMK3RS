import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  Eye,
  Trash2,
  Upload,
  Loader2,
  CloudUpload,
  CheckCircle2,
  Clock,
  X,
  FileText,
  FileCheck2,
} from 'lucide-react';
import { useK3 } from '../../context/K3Context';
import { OFFICIAL_SIDEBAR_MENUS } from '../../data/menuConfig';

interface ModuleChecklistViewProps {
  moduleId: string;
}

function getFileTypeBadge(ext: string) {
  const e = ext.toLowerCase();
  if (e === 'pdf') {
    return { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'PDF' };
  }
  if (['doc', 'docx', 'word'].includes(e)) {
    return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'DOCX' };
  }
  if (['xls', 'xlsx', 'csv'].includes(e)) {
    return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'EXCEL' };
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(e)) {
    return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'IMG' };
  }
  if (['mp4', 'mov', 'avi'].includes(e)) {
    return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'VIDEO' };
  }
  return { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: ext.toUpperCase() };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const ModuleChecklistView: React.FC<ModuleChecklistViewProps> = ({ moduleId }) => {
  const {
    items,
    setActiveModuleId,
    uploadDocuments,
    syncDocumentToGoogleDrive,
    deleteDocument,
    setViewingDocState,
  } = useK3();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'uploaded'>('all');
  const [selectedFilesByItem, setSelectedFilesByItem] = useState<Record<string, FileList | null>>({});
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [syncingDocId, setSyncingDocId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const menuInfo =
    OFFICIAL_SIDEBAR_MENUS.find((m) => m.id === moduleId) || OFFICIAL_SIDEBAR_MENUS[1];

  const moduleItems = items.filter((item) => item.moduleId === moduleId);

  // Statistics: Exclude section headers from percentage denominator
  const actionableItems = moduleItems.filter((i) => !i.isSectionHeader);
  const totalActionable = actionableItems.length;
  const uploadedActionable = actionableItems.filter((i) => i.documents.length > 0).length;
  const uploadedPercentage =
    totalActionable > 0 ? Math.round((uploadedActionable / totalActionable) * 100) : 0;

  // Filter items by status and search query
  const filteredItems = moduleItems.filter((item) => {
    // If section header, keep if its section has matching items or query is empty
    if (item.isSectionHeader && !searchQuery.trim() && statusFilter === 'all') {
      return true;
    }

    if (item.isSectionHeader && statusFilter !== 'all') {
      return false;
    }

    const hasDocs = item.documents.length > 0;
    if (statusFilter === 'pending' && hasDocs) return false;
    if (statusFilter === 'uploaded' && !hasDocs) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      item.standardNumber.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      item.documents.some((d) => d.name.toLowerCase().includes(q))
    );
  });

  const handleFileChange = (itemId: string, files: FileList | null) => {
    setSelectedFilesByItem((prev) => ({
      ...prev,
      [itemId]: files,
    }));
  };

  const handleRemoveSelectedFile = (itemId: string) => {
    setSelectedFilesByItem((prev) => ({
      ...prev,
      [itemId]: null,
    }));
    if (fileInputRefs.current[itemId]) {
      fileInputRefs.current[itemId]!.value = '';
    }
  };

  const handleUploadSubmit = async (itemId: string) => {
    const files = selectedFilesByItem[itemId];
    if (!files || files.length === 0) {
      fileInputRefs.current[itemId]?.click();
      return;
    }

    try {
      setUploadingItemId(itemId);
      await uploadDocuments(itemId, files);
      setSelectedFilesByItem((prev) => ({ ...prev, [itemId]: null }));
      if (fileInputRefs.current[itemId]) {
        fileInputRefs.current[itemId]!.value = '';
      }
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleSyncDoc = async (itemId: string, docId: string) => {
    try {
      setSyncingDocId(docId);
      await syncDocumentToGoogleDrive(itemId, docId);
    } finally {
      setSyncingDocId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Return Button with breadcrumb style */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveModuleId('RINGKASAN')}
          className="group inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-teal-700 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white group-hover:border-teal-300 group-hover:bg-teal-50 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          </div>
          <span>Kembali ke Ringkasan</span>
        </button>

        <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
          {menuInfo.path}
        </span>
      </div>

      {/* Header Banner Card (Pixel match to Image 3 with refined elevation) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                LENGKAPI DOKUMEN
              </span>
              {menuInfo.checklistMapping && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                  {menuInfo.checklistMapping}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {menuInfo.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Unggah bukti untuk setiap persyaratan. Semua item tetap terlihat meskipun belum ada
              file.
            </p>
          </div>

          {/* Right Kelengkapan Dokumen Box */}
          <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-4 min-w-[280px] shrink-0 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Kelengkapan dokumen</span>
              <span className="font-extrabold text-slate-900 text-sm tabular-nums">
                {uploadedPercentage}%
              </span>
            </div>

            <div className="my-2.5 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${uploadedPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{uploadedActionable} dari {totalActionable} persyaratan</span>
              <span className="font-semibold text-slate-700">
                {totalActionable - uploadedActionable} belum
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Container Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {/* Card Header: Title + Filter Tabs + Search Counter Pill matching screenshot */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Daftar Persyaratan</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Satu persyaratan dapat memiliki beberapa dokumen pendukung.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Filter Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/60 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({totalActionable})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum ({totalActionable - uploadedActionable})
              </button>
              <button
                onClick={() => setStatusFilter('uploaded')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  statusFilter === 'uploaded'
                    ? 'bg-white text-teal-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lengkap ({uploadedActionable})
              </button>
            </div>

            {/* Counter / Search Pill matching image top-right */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`${filteredItems.filter((i) => !i.isSectionHeader).length} item checklist`}
                className="w-44 sm:w-48 rounded-full border border-slate-200/90 bg-white pl-8 pr-7 py-1.5 text-xs text-slate-700 placeholder-slate-500 focus:border-teal-500 focus:outline-none shadow-2xs"
                title="Cari persyaratan atau nama file"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="divide-y divide-slate-100">
          {filteredItems.map((item) => {
            const hasDocs = item.documents.length > 0;
            const isUploading = uploadingItemId === item.id;
            const currentSelectedFiles = selectedFilesByItem[item.id];
            const hasSelectedFile = Boolean(currentSelectedFiles && currentSelectedFiles.length > 0);

            // Case A: Section Header (e.g. 3, 3.1, 4, 4.1, 5, 6, 8, etc.)
            if (item.isSectionHeader) {
              return (
                <div key={item.id} className="p-5 sm:p-6 bg-slate-50/70 border-l-4 border-teal-600">
                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold font-mono">
                    {item.standardNumber}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">
                    {item.title}
                  </h3>
                  {item.description && item.description !== item.title && (
                    <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                  )}
                </div>
              );
            }

            // Case B: Actionable Checklist Item - Side by side layout matching user screenshot
            return (
              <div key={item.id} className="p-5 sm:p-6 transition-colors hover:bg-slate-50/20">
                <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
                  {/* Left Column: Badges, Title & Attached Documents */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Top Row: Number Badge & Status Badge side by side */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold font-mono">
                        {item.standardNumber}
                      </span>

                      {hasDocs ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Lengkap ({item.documents.length})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Belum ada dokumen
                        </span>
                      )}
                    </div>

                    {/* Requirement Title */}
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h3>

                    {/* Optional Description */}
                    {item.description && item.description !== item.title && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Attached Documents List (if any) */}
                    {hasDocs && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Dokumen Terlampir ({item.documents.length})
                        </span>
                        {item.documents.map((doc) => {
                          const isThisDocSyncing = syncingDocId === doc.id;
                          const badge = getFileTypeBadge(doc.fileType);

                          return (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className={`flex h-7 w-9 shrink-0 items-center justify-center rounded-md text-[9px] font-black border uppercase tracking-wider ${badge.bg}`}
                                >
                                  {badge.label}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">
                                    {doc.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {doc.fileSize} · {doc.uploadDate}
                                    {doc.isGDrive && (
                                      <span className="ml-1.5 text-emerald-700 font-sans font-bold">
                                        ✓ Google Drive
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setViewingDocState({
                                      doc,
                                      requirementTitle: item.title,
                                      requirementNumber: item.standardNumber,
                                      itemId: item.id,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors border border-teal-200/60"
                                  title="Lihat Pratinjau Dokumen"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Lihat</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteDocument(item.id, doc.id);
                                  }}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Hapus Dokumen"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Hapus</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Vertical separator line matching screenshot */}
                  <div className="hidden lg:block w-px bg-slate-100 self-stretch my-1" />

                  {/* Right Column: Custom Form Upload exactly matching user image */}
                  <div className="w-full lg:w-[400px] xl:w-[440px] shrink-0">
                    <div className="rounded-2xl border border-dashed border-[#5eead4] bg-[#f0fdfa]/40 p-4 sm:p-5 shadow-2xs">
                      {/* Box Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100/90 text-teal-700 shadow-2xs shrink-0">
                            <Upload className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">Unggah bukti</span>
                        </div>
                        <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                          PDF, Office, gambar, video
                        </span>
                      </div>

                      {/* File Picker Row */}
                      <div className="mt-3.5 space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 block">
                          Pilih file
                        </label>

                        {/* File Selector Box */}
                        <div
                          onClick={() => fileInputRefs.current[item.id]?.click()}
                          className="flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs cursor-pointer min-w-0"
                        >
                          <FileText className="h-4 w-4 text-slate-400 shrink-0 ml-0.5" />

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRefs.current[item.id]?.click();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition-colors shrink-0"
                          >
                            Pilih File
                          </button>

                          <div className="flex-1 min-w-0 pr-1">
                            {hasSelectedFile && currentSelectedFiles ? (
                              <span className="text-xs sm:text-sm font-semibold text-teal-900 truncate block">
                                {currentSelectedFiles.length === 1
                                  ? `${currentSelectedFiles[0].name} (${formatFileSize(currentSelectedFiles[0].size)})`
                                  : `${currentSelectedFiles.length} file dipilih`}
                              </span>
                            ) : (
                              <span className="text-xs sm:text-sm text-slate-500 truncate block">
                                Tidak ada file yang dipilih
                              </span>
                            )}
                          </div>

                          {hasSelectedFile && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSelectedFile(item.id);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors shrink-0"
                              title="Batal pilih file"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Native input hidden */}
                        <input
                          ref={(el) => {
                            fileInputRefs.current[item.id] = el;
                          }}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileChange(item.id, e.target.files)}
                        />
                      </div>

                      {/* Big Submit Button: sage/teal styling matching user screenshot */}
                      <button
                        type="button"
                        onClick={() => handleUploadSubmit(item.id)}
                        disabled={isUploading}
                        className="mt-3.5 w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs bg-[#5fa89b] hover:bg-[#529388] active:bg-[#4a8479] text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Mengunggah dokumen...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            <span>Unggah dokumen</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="p-12 text-center text-slate-400 text-xs">
              Tidak ada persyaratan yang cocok dengan saringan saat ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
