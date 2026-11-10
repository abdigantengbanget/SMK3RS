import React from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useK3 } from '../../context/K3Context';
import { OFFICIAL_SIDEBAR_MENUS } from '../../data/menuConfig';

export const ExportModal: React.FC = () => {
  const {
    isExportModalOpen,
    setIsExportModalOpen,
    items,
    stats,
    moduleSummaries,
  } = useK3();

  if (!isExportModalOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'No. Persyaratan',
      'Modul K3RS',
      'Uraian Standar & Persyaratan',
      'Regulasi / Standar Acuan',
      'Unit PIC',
      'Status Kepatuhan',
      'Jumlah Dokumen',
      'Daftar Nomor Dokumen',
      'Catatan Verifikasi',
      'Terakhir Diperbarui',
    ];

    const rows = items.map((item) => {
      const menu = OFFICIAL_SIDEBAR_MENUS.find((m) => m.id === item.moduleId);
      const docList = item.documents
        .map((d) => (d.isGDrive ? `${d.name} [GDrive] (${d.gdriveUrl || d.docNumber})` : `${d.name} (${d.docNumber})`))
        .join('; ');
      return [
        `"${item.standardNumber}"`,
        `"${menu?.name || item.moduleId}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${(item.regulationRef || '').replace(/"/g, '""')}"`,
        `"${item.picUnit || ''}"`,
        `"${item.status.toUpperCase()}"`,
        item.documents.length,
        `"${docList.replace(/"/g, '""')}"`,
        `"${(item.notes || '').replace(/"/g, '""')}"`,
        `"${item.lastUpdated}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Rekapitulasi_Master_Checklist_K3RS_RSSG_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Laporan Rekapitulasi Master Checklist K3RS
              </h3>
              <p className="text-xs text-slate-500">
                RS Semen Gresik · Komite Keselamatan dan Kesehatan Kerja Rumah Sakit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="h-4 w-4 text-teal-600" />
              <span>Unduh CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak / Simpan PDF</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible text-slate-800 text-xs">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <ShieldCheck className="h-8 w-8 text-teal-600" />
              <div className="text-left">
                <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  RUMAH SAKIT SEMEN GRESIK
                </h1>
                <p className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider">
                  KOMITE KESELAMATAN DAN KESEHATAN KERJA RUMAH SAKIT (K3RS)
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Jl. R.A. Kartini No.280, Kebomas, Kab. Gresik, Jawa Timur 61122 · Telp: (031) 3987840
            </p>
            <div className="mt-3 inline-block bg-slate-100 px-4 py-1 rounded-full font-bold text-xs text-slate-800">
              REKAPITULASI DOKUMEN MASTER CHECKLIST K3RS RESMI
            </div>
          </div>

          {/* KPI Summary strip */}
          <div className="grid grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 mb-6 text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Total Persyaratan</span>
              <span className="text-lg font-black text-slate-900">{stats.totalItems} Standar</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Sudah Terupload</span>
              <span className="text-lg font-black text-teal-700">{stats.uploadedPercentage}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Belum Terupload</span>
              <span className="text-lg font-black text-slate-700">{stats.pendingPercentage}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Total Berkas Terlampir</span>
              <span className="text-lg font-black text-teal-700">{stats.totalDocuments} Dokumen</span>
            </div>
          </div>

          {/* Module Status Breakdown */}
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wider border-b border-slate-200 pb-1">
              Rekapitulasi Kepatuhan Per Modul Standar
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {moduleSummaries.map((m) => (
                <div key={m.moduleId} className="p-2 rounded border border-slate-200 bg-white">
                  <div className="flex justify-between items-center text-[11px] font-semibold">
                    <span className="truncate">{m.moduleName}</span>
                    <span className="text-teal-700 font-bold">{m.uploadedPercentage}%</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {m.uploadedCount}/{m.totalItems} Terupload · {m.pendingPercentage}% Belum
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Item List */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs mb-2 uppercase tracking-wider border-b border-slate-200 pb-1">
              Rincian Master Checklist & Dokumen Bukti
            </h4>
            <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <th className="border border-slate-300 p-2 w-24">No. Syarat</th>
                  <th className="border border-slate-300 p-2">Persyaratan & Regulasi</th>
                  <th className="border border-slate-300 p-2 w-28">Unit PIC</th>
                  <th className="border border-slate-300 p-2 w-20 text-center">Status</th>
                  <th className="border border-slate-300 p-2">Dokumen Bukti</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="border border-slate-300 p-2 font-mono font-bold text-teal-800 align-top">
                      {item.standardNumber}
                    </td>
                    <td className="border border-slate-300 p-2 align-top">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.regulationRef}</div>
                      {item.notes && (
                        <div className="text-[10px] text-teal-800 italic mt-1">
                          Catatan: {item.notes}
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-300 p-2 align-top text-slate-600">
                      {item.picUnit}
                    </td>
                    <td className="border border-slate-300 p-2 text-center align-top font-bold">
                      {item.status === 'lengkap' ? (
                        <span className="text-emerald-700">LENGKAP</span>
                      ) : item.status === 'proses' ? (
                        <span className="text-amber-700">PROSES</span>
                      ) : (
                        <span className="text-rose-700">BELUM</span>
                      )}
                    </td>
                    <td className="border border-slate-300 p-2 align-top">
                      {item.documents.length > 0 ? (
                        <ul className="list-disc pl-3 space-y-0.5">
                          {item.documents.map((d) => (
                            <li key={d.id} className="text-[10px]">
                              <strong>{d.name}</strong> <span className="text-slate-500">({d.docNumber})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 italic">Belum ada dokumen</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signature Sign-off footer */}
          <div className="mt-8 pt-6 border-t border-slate-300 flex justify-between text-center print:flex">
            <div>
              <p className="text-[11px] text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900 text-xs mt-1">Direktur RS Semen Gresik</p>
              <div className="h-16" />
              <p className="font-bold underline text-slate-900 text-xs">dr. H. R. Pramono, Sp.B</p>
              <p className="text-[10px] text-slate-500">NIP. 19740518 200212 1 002</p>
            </div>

            <div>
              <p className="text-[11px] text-slate-600">Gresik, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold text-slate-900 text-xs mt-1">Ketua Komite K3RS</p>
              <div className="h-16" />
              <p className="font-bold underline text-slate-900 text-xs">dr. Ahmad Faisal, M.K.K.K.</p>
              <p className="text-[10px] text-slate-500">Lisensi AK3U Kemnaker RI</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
