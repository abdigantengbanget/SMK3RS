import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  UploadCloud,
  FileCheck2,
  Trash2,
  Eye,
  Plus,
  Save,
  ExternalLink,
  FolderOpen,
  Link as LinkIcon,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useK3, GDRIVE_MAIN_FOLDER_URL, GDRIVE_FOLDER_ID } from '../../context/K3Context';
import { ComplianceStatus } from '../../types/k3';

const GoogleGLogo: React.FC = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const ManageDocModal: React.FC = () => {
  const {
    activeDocModalItem,
    setActiveDocModalItem,
    updateItemStatus,
    uploadDocuments,
    linkGDriveDocument,
    deleteDocument,
    setViewingDocState,
    currentUser,
    isLoggedIn,
    isLoggingIn,
    handleGoogleLogin,
  } = useK3();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'gdrive'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [docNumberPrefix, setDocNumberPrefix] = useState('');
  const [notes, setNotes] = useState(activeDocModalItem?.notes || '');
  const [status, setStatus] = useState<ComplianceStatus>(activeDocModalItem?.status || 'belum');
  const [uploadFeedback, setUploadFeedback] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  // GDrive form states
  const [gdriveDocName, setGdriveDocName] = useState('');
  const [gdriveUrl, setGdriveUrl] = useState('');
  const [gdriveDocNumber, setGdriveDocNumber] = useState('');

  if (!activeDocModalItem) return null;

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadFeedback(null);
    try {
      const result = await uploadDocuments(activeDocModalItem.id, files, docNumberPrefix);
      setDocNumberPrefix('');
      if (result.savedToGDrive) {
        setUploadFeedback({
          type: 'success',
          message: `${result.uploadedCount} berkas berhasil diunggah & tersimpan langsung ke Google Drive K3RS!`,
        });
      } else {
        setUploadFeedback({
          type: 'info',
          message: `${result.uploadedCount} berkas berhasil tersimpan di sistem lokal!`,
        });
      }
      setTimeout(() => setUploadFeedback(null), 5000);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadFeedback({
        type: 'info',
        message: 'Gagal mengunggah berkas. Silakan coba kembali.',
      });
      setTimeout(() => setUploadFeedback(null), 5000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleLinkGDriveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gdriveDocName.trim() || !gdriveUrl.trim()) return;

    linkGDriveDocument(
      activeDocModalItem.id,
      gdriveDocName.trim(),
      gdriveUrl.trim(),
      gdriveDocNumber.trim()
    );

    setGdriveDocName('');
    setGdriveUrl('');
    setGdriveDocNumber('');
  };

  const handleSaveNotes = () => {
    const finalStatus: ComplianceStatus =
      activeDocModalItem.documents.length > 0 ? 'lengkap' : 'belum';
    updateItemStatus(activeDocModalItem.id, finalStatus, notes);
    setActiveDocModalItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                {activeDocModalItem.standardNumber}
              </span>
              <span className="text-xs text-slate-500 font-medium truncate">
                PIC: {activeDocModalItem.picUnit}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1 truncate">
              {activeDocModalItem.title}
            </h3>
          </div>

          <button
            onClick={() => setActiveDocModalItem(null)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors shrink-0"
            aria-label="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* GDrive Connection & Account Status Banner */}
          {isLoggedIn && currentUser ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User"
                    className="h-8 w-8 rounded-full border border-emerald-300 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-emerald-950 block">
                      Google Drive Terhubung ({currentUser.displayName || currentUser.email})
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700">
                    Setiap file yang diunggah langsung tersimpan ke folder GDrive K3RS (ID: <code className="font-mono text-emerald-900">{GDRIVE_FOLDER_ID}</code>)
                  </span>
                </div>
              </div>

              <a
                href={GDRIVE_MAIN_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold text-xs hover:bg-emerald-100/70 transition-colors shadow-2xs self-start sm:self-auto"
              >
                <span>Buka Folder Drive</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/90 border border-blue-200 text-xs text-blue-950">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-blue-950 block">
                    Penyimpanan Otomatis ke Google Drive K3RS
                  </span>
                  <span className="text-[11px] text-blue-700">
                    Masuk dengan Google agar file yang diunggah langsung tersimpan ke folder Google Drive resmi RS Semen Gresik
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-300 text-slate-800 font-semibold text-xs hover:bg-blue-100/70 transition-colors shadow-2xs"
                >
                  {isLoggingIn ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
                  ) : (
                    <GoogleGLogo />
                  )}
                  <span>{isLoggingIn ? 'Menghubungkan...' : 'Masuk Google'}</span>
                </button>

                <a
                  href={GDRIVE_MAIN_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-2xs"
                  title="Buka Folder Drive"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Upload Feedback Toast */}
          {uploadFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                uploadFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-blue-50 border-blue-300 text-blue-800'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{uploadFeedback.message}</span>
            </div>
          )}

          {/* Mode Switcher: Upload File Langsung vs Tautkan dari GDrive */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>Upload File Langsung</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gdrive')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'gdrive'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Tautkan Dokumen dari GDrive</span>
              </button>
            </div>

            {/* TAB 1: UPLOAD LOCAL FILES */}
            {activeTab === 'upload' && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={docNumberPrefix}
                    onChange={(e) => setDocNumberPrefix(e.target.value)}
                    placeholder="Nomor Surat / SK / SPO resmi (opsional)..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-teal-500 bg-teal-50/80 scale-[1.01]'
                      : 'border-slate-300 bg-slate-50/70 hover:bg-teal-50/30 hover:border-teal-400'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700 mb-2">
                    <Upload className="h-6 w-6 stroke-[2.2]" />
                  </div>

                  {isUploading ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-teal-800 animate-pulse">
                        Sedang mengunggah dan menyimpan dokumen ke Google Drive...
                      </p>
                      <p className="text-[11px] text-slate-500">Mohon tunggu sebentar</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900">
                        Klik untuk memilih berkas atau seret & lepas file ke sini
                      </p>
                      <p className="text-[11px] text-teal-700 font-semibold">
                        Bisa pilih <strong>lebih dari 1 file</strong> sekaligus (PDF, Word, Excel, Foto/Scan, ZIP, dll.)
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {isLoggedIn
                          ? '✓ Akun Google terhubung: File langsung tersimpan ke folder Google Drive K3RS'
                          : 'File tersimpan di sistem lokal. Masuk dengan Google untuk simpan langsung ke Google Drive.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: LINK FROM GOOGLE DRIVE FOLDER */}
            {activeTab === 'gdrive' && (
              <form onSubmit={handleLinkGDriveSubmit} className="space-y-3 p-4 rounded-xl border border-teal-200 bg-teal-50/30">
                <div className="flex items-center justify-between text-xs text-teal-900 font-bold mb-1">
                  <span>Tautkan File dari Folder Google Drive K3RS</span>
                  <a
                    href={GDRIVE_MAIN_FOLDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 hover:underline inline-flex items-center gap-1 font-semibold text-[11px]"
                  >
                    <span>Salin link dari folder GDrive</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nama Dokumen / Berkas *
                  </label>
                  <input
                    type="text"
                    required
                    value={gdriveDocName}
                    onChange={(e) => setGdriveDocName(e.target.value)}
                    placeholder="Contoh: SK Direktur tentang Kebijakan K3RS 2026"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tautan / Link Google Drive Berkas *
                  </label>
                  <input
                    type="url"
                    required
                    value={gdriveUrl}
                    onChange={(e) => setGdriveUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nomor Dokumen / SK (opsional)
                  </label>
                  <input
                    type="text"
                    value={gdriveDocNumber}
                    onChange={(e) => setGdriveDocNumber(e.target.value)}
                    placeholder="Contoh: 042/SK-DIR/RSSG/2026"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tautkan Dokumen GDrive</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* LIST OF CURRENTLY UPLOADED / LINKED DOCUMENTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-teal-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Daftar Dokumen Terupload ({activeDocModalItem.documents.length})
                </h4>
              </div>

              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  activeDocModalItem.documents.length > 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {activeDocModalItem.documents.length > 0 ? '✓ Terupload' : 'Belum Ada Berkas'}
              </span>
            </div>

            <div className="space-y-2">
              {activeDocModalItem.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-black uppercase border ${
                        doc.isGDrive
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-teal-50 text-teal-800 border-teal-200'
                      }`}
                    >
                      {doc.isGDrive ? 'GDRIVE' : doc.fileType.slice(0, 4)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {doc.name}
                        </p>
                        {doc.isGDrive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                            GDrive
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">
                        No: {doc.docNumber || '-'} · {doc.fileSize} · Diunggah: {doc.uploadDate}
                      </p>
                    </div>
                  </div>

                  {/* Actions: LIHAT DOKUMEN & HAPUS DOKUMEN */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* View Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setViewingDocState({
                          doc,
                          requirementTitle: activeDocModalItem.title,
                          requirementNumber: activeDocModalItem.standardNumber,
                          itemId: activeDocModalItem.id,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50/70 text-xs font-semibold text-teal-800 hover:bg-teal-600 hover:text-white transition-colors"
                      title="Lihat Pratinjau Dokumen"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Lihat</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => deleteDocument(activeDocModalItem.id, doc.id)}
                      className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {activeDocModalItem.documents.length === 0 && (
                <div className="text-center py-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
                  Belum ada dokumen yang diunggah untuk persyaratan ini.
                  Gunakan area upload atau tautkan dari Google Drive di atas.
                </div>
              )}
            </div>
          </div>

          {/* Verification Notes */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Catatan Internal / Keterangan Persyaratan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan khusus verifikasi, link rujukan, atau instruksi tindak lanjut..."
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50">
          <span className="text-[11px] text-slate-500 font-medium">
            Status: {activeDocModalItem.documents.length > 0 ? (
              <strong className="text-emerald-700">Terupload ({activeDocModalItem.documents.length} dokumen)</strong>
            ) : (
              <strong className="text-slate-600">Belum Ada Dokumen</strong>
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveDocModalItem(null)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveNotes}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Selesai & Simpan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
