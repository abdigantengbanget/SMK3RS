import React, { useState } from "react";
import {
  X,
  FolderOpen,
  ExternalLink,
  Copy,
  Check,
  Save,
  Code2,
  Sparkles,
  ShieldCheck,
  LogOut,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  useK3,
  GDRIVE_MAIN_FOLDER_URL,
  GDRIVE_FOLDER_ID,
} from "../../context/K3Context";

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

export const GDriveConfigModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const {
    gdriveWebhookUrl,
    setGdriveWebhookUrl,
    currentUser,
    isLoggedIn,
    isLoggingIn,
    handleGoogleLogin,
    handleGoogleLogout,
  } = useK3();

  const [webhookInput, setWebhookInput] = useState(gdriveWebhookUrl || "");
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const scriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // FITUR 1: HAPUS FILE DARI GOOGLE DRIVE
    if (data.action === "delete" || data.action === "remove") {
      var fileId = data.fileId || data.id;
      if (!fileId) throw new Error("File ID tidak ditemukan");
      var fileToDelete = DriveApp.getFileById(fileId);
      fileToDelete.setTrashed(true); // Memindahkan file ke Sampah Drive
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "File berhasil dihapus dari Google Drive",
        fileId: fileId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // FITUR 2: UNGGAH FILE KE GOOGLE DRIVE
    var folder = DriveApp.getFolderById("${GDRIVE_FOLDER_ID}");
    var decoded = Utilities.base64Decode(data.base64);
    var fileName = data.fileName || data.name || "dokumen_k3rs";
    var blob = Utilities.newBlob(decoded, data.mimeType || "application/octet-stream", fileName);
    var file = folder.createFile(blob);
    if (data.docNumber) {
      file.setDescription("Nomor Dokumen: " + data.docNumber + " - Diunggah via Dashboard K3RS RS Semen Gresik");
    } else {
      file.setDescription("Diunggah via Dashboard K3RS RS Semen Gresik");
    }
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      fileId: file.getId(),
      url: file.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    setGdriveWebhookUrl(webhookInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Integrasi Cloud Google Drive K3RS
              </h3>
              <p className="text-xs text-blue-200">
                Folder ID: {GDRIVE_FOLDER_ID}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-600">
          {/* Target Folder Link Banner */}
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-blue-950">
            <div>
              <span className="font-bold text-xs block text-blue-900">
                Folder Target Penyimpanan Google Drive:
              </span>
              <span className="font-mono text-[11px] text-blue-700 break-all select-all">
                {GDRIVE_MAIN_FOLDER_URL}
              </span>
            </div>
            <a
              href={GDRIVE_MAIN_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
            >
              <span>Buka Folder di Tab Baru</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* SECTION 1: GOOGLE ACCOUNT OAUTH INTEGRATION */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>Status Koneksi Akun Google Drive (Utama)</span>
            </h4>
            <p className="leading-relaxed text-slate-600">
              Dengan login menggunakan Akun Google, setiap dokumen yang diunggah
              dari dashboard ini akan{" "}
              <strong>
                secara otomatis diunggah langsung ke folder Google Drive bersama
              </strong>{" "}
              di atas. Anda tidak perlu repot membuka tab Drive manual untuk
              memindahkan file.
            </p>

            {isLoggedIn && currentUser ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-300">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="User"
                      className="h-10 w-10 rounded-full border border-emerald-400"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 font-bold text-white uppercase text-sm">
                      {currentUser.displayName?.[0] ||
                        currentUser.email?.[0] ||
                        "U"}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-xs text-emerald-950">
                        {currentUser.displayName || "Pengguna Terverifikasi"}
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-700 block font-mono">
                      {currentUser.email}
                    </span>
                    <span className="text-[10px] text-emerald-800 font-semibold">
                      ✓ Akses penyimpanan Google Drive Aktif
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGoogleLogout()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-white border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block text-xs">
                    Belum Terhubung ke Google Drive
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Klik tombol di samping untuk mengaktifkan upload otomatis
                    langsung ke folder K3RS
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-sm transition-all disabled:opacity-75 self-start sm:self-auto shrink-0"
                >
                  {isLoggingIn ? (
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  ) : (
                    <GoogleGLogo />
                  )}
                  <span>
                    {isLoggingIn ? "Menghubungkan..." : "Masuk dengan Google"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: OPTIONAL GOOGLE APPS SCRIPT WEBHOOK */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <span>Opsi Tambahan: Google Apps Script Webhook (Opsional)</span>
            </h4>
            <p className="leading-relaxed text-slate-600">
              Jika Anda ingin sistem menyimpan file ke Drive secara background
              tanpa meminta login kepada setiap staf/auditor, Anda dapat
              memasang skrip <em>Google Apps Script Web App</em> di bawah ini:
            </p>
          </div>

          {/* Script Code Block */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="relative rounded-lg bg-slate-900 p-3 text-slate-200 font-mono text-[11px] overflow-x-auto">
              <button
                type="button"
                onClick={handleCopyScript}
                className="absolute right-2.5 top-2.5 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-white text-[10px] font-semibold hover:bg-slate-700 transition-colors"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copied ? "Tersalin" : "Salin Skrip"}</span>
              </button>
              <pre className="pr-20 text-[10.5px] leading-relaxed">
                {scriptCode}
              </pre>
            </div>
          </div>

          {/* Webhook Input Form */}
          <form onSubmit={handleSaveWebhook} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Web App URL Google Apps Script (Opsional)
              </label>
              <input
                type="url"
                value={webhookInput}
                onChange={(e) => setWebhookInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>

            {savedSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Pengaturan berhasil disimpan!</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Konfigurasi</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
