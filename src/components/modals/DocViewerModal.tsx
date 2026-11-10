import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  FileCheck,
  FolderOpen,
} from 'lucide-react';
import { DocumentEvidence } from '../../types/k3';
import { getFileBlob } from '../../utils/fileStorage';

interface DocViewerModalProps {
  document: DocumentEvidence | null;
  requirementTitle?: string;
  requirementNumber?: string;
  onClose: () => void;
  onDelete?: (docId: string) => void;
}

export const DocViewerModal: React.FC<DocViewerModalProps> = ({
  document,
  requirementTitle,
  requirementNumber,
  onClose,
  onDelete,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    let activeUrl: string | null = null;
    let isMounted = true;

    async function loadDocument() {
      if (!document) return;
      setLoading(true);
      setTextContent(null);

      // If Google Drive link
      if (document.isGDrive && document.gdriveUrl) {
        setLoading(false);
        return;
      }

      try {
        // Try IndexedDB first
        const blob = await getFileBlob(document.id);
        if (blob && isMounted) {
          activeUrl = URL.createObjectURL(blob);
          setBlobUrl(activeUrl);

          if (
            blob.type.includes('text') ||
            blob.type.includes('json') ||
            blob.type.includes('csv') ||
            blob.type.includes('javascript')
          ) {
            const text = await blob.text();
            if (isMounted) setTextContent(text.slice(0, 10000));
          }
          setLoading(false);
          return;
        }

        // Fallback to dataUrl
        if (document.dataUrl && isMounted) {
          setBlobUrl(document.dataUrl);
        }
      } catch (err) {
        console.error('Error loading file blob:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDocument();

    return () => {
      isMounted = false;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [document]);

  if (!document) return null;

  // Google Drive embed preview logic
  let gdrivePreviewUrl = document.gdriveUrl || '';
  if (document.isGDrive && document.gdriveUrl) {
    const fileIdMatch = document.gdriveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const paramIdMatch = document.gdriveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const fileId = fileIdMatch ? fileIdMatch[1] : paramIdMatch ? paramIdMatch[1] : null;

    if (fileId) {
      gdrivePreviewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    }
  }

  const isImage =
    document.fileType.toLowerCase().match(/jpg|jpeg|png|gif|webp|svg/) ||
    document.mimeType?.startsWith('image/');
  const isPdf =
    document.fileType.toLowerCase() === 'pdf' ||
    document.mimeType === 'application/pdf';

  const handleDownload = () => {
    if (blobUrl) {
      const a = window.document.createElement('a');
      a.href = blobUrl;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    }
  };

  const handleOpenNewTab = () => {
    const targetUrl = document.isGDrive && document.gdriveUrl ? document.gdriveUrl : blobUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              {requirementNumber && (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                  {requirementNumber}
                </span>
              )}
              <span className="text-xs text-slate-500 truncate">
                {requirementTitle}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {document.name}
              </h3>
              {document.isGDrive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                  Google Drive
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Nomor: {document.docNumber || '-'} · Format: {document.fileType} · Ukuran: {document.fileSize} · Diunggah: {document.uploadDate}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {document.isGDrive ? (
              <button
                onClick={handleOpenNewTab}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
                title="Buka File di Google Drive"
              >
                <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
                <span>Buka di GDrive</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            ) : blobUrl ? (
              <>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Unduh File Asli"
                >
                  <Download className="h-3.5 w-3.5 text-teal-600" />
                  <span className="hidden sm:inline">Unduh</span>
                </button>

                <button
                  onClick={handleOpenNewTab}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  title="Buka pada Tab Baru"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Buka Tab Baru</span>
                </button>
              </>
            ) : null}

            {onDelete && (
              <button
                onClick={() => {
                  onDelete(document.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                title="Hapus Dokumen Ini"
              >
                <span>Hapus</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors ml-2"
              aria-label="Tutup Pratinjau"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 flex items-center justify-center min-h-[380px]">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
              <p className="mt-3 text-xs text-slate-500 font-medium">Memuat pratinjau dokumen...</p>
            </div>
          ) : document.isGDrive && gdrivePreviewUrl ? (
            <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-slate-300 bg-white shadow-md flex flex-col">
              <iframe
                src={gdrivePreviewUrl}
                title={document.name}
                className="w-full flex-1 border-0"
                allow="autoplay"
              />
            </div>
          ) : isImage && blobUrl ? (
            <div className="max-w-full max-h-[65vh] flex items-center justify-center">
              <img
                src={blobUrl}
                alt={document.name}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md border border-slate-300 bg-white"
              />
            </div>
          ) : isPdf && blobUrl ? (
            <div className="w-full h-[65vh] rounded-lg overflow-hidden border border-slate-300 bg-white shadow-md">
              <iframe
                src={blobUrl}
                title={document.name}
                className="w-full h-full border-0"
              />
            </div>
          ) : textContent ? (
            <div className="w-full max-h-[65vh] overflow-y-auto p-4 rounded-lg bg-white border border-slate-300 font-mono text-xs text-slate-800 whitespace-pre-wrap shadow-xs">
              {textContent}
            </div>
          ) : (
            /* Generic File Box */
            <div className="text-center max-w-md p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 mb-4">
                <FileCheck className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {document.name}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Berkas tipe <strong className="text-slate-800 uppercase">{document.fileType}</strong> siap diakses.
              </p>

              <div className="mt-6 flex justify-center gap-3">
                {document.isGDrive && document.gdriveUrl ? (
                  <button
                    onClick={handleOpenNewTab}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span>Buka Dokumen di Google Drive</span>
                  </button>
                ) : blobUrl ? (
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
                  >
                    <Download className="h-4 w-4" />
                    <span>Unduh Berkas</span>
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <span>RS Semen Gresik · Sistem Verifikasi K3RS Digital</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
