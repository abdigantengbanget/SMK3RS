import React from 'react';
import {
  X,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  BookOpen,
  Award,
  FolderOpen,
} from 'lucide-react';
import { useK3 } from '../../context/K3Context';
import { OFFICIAL_SIDEBAR_MENUS } from '../../data/menuConfig';

export const HospitalInfoModal: React.FC = () => {
  const { isHospitalInfoModalOpen, setIsHospitalInfoModalOpen } = useK3();

  if (!isHospitalInfoModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Komite K3RS RS Semen Gresik
              </h3>
              <p className="text-xs text-teal-300">
                Keselamatan dan Kesehatan Kerja Rumah Sakit
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsHospitalInfoModalOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-600">
          {/* Mission statement */}
          <div className="rounded-xl bg-teal-50/70 p-4 border border-teal-200 text-teal-950">
            <h4 className="font-bold text-sm text-teal-900 mb-1 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-teal-700" />
              <span>Komitmen Manajemen K3RS Rumah Sakit Semen Gresik</span>
            </h4>
            <p className="text-xs leading-relaxed text-teal-800">
              Mewujudkan lingkungan pelayanan rumah sakit yang aman, sehat, dan selamat bagi pasien,
              keluarga pengunjung, serta seluruh tenaga kesehatan dan karyawan, selaras dengan
              Standar Nasional Akreditasi Rumah Sakit (STARKES) dan Permenkes No. 66 Tahun 2016.
            </p>
          </div>

          {/* Official 13 Patent Menus mapping reference */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-slate-700" />
              <span>Struktur Resmi 13 Menu & Pemetaan Master Checklist</span>
            </h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-2 w-8">No</th>
                    <th className="p-2">Nama Menu Utama</th>
                    <th className="p-2">Isi Master Checklist / Tautan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {OFFICIAL_SIDEBAR_MENUS.map((menu, idx) => (
                    <tr key={menu.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-semibold text-slate-900">
                        {menu.name}
                        {menu.isExternal && (
                          <span className="ml-1 text-[10px] text-teal-600 font-normal">
                            (Eksternal)
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-teal-800 font-medium">
                        {menu.checklistMapping}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Google Drive Shared Repository */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <FolderOpen className="h-5 w-5 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold text-blue-950 block">Penyimpanan Google Drive Resmi K3RS</span>
                <span className="text-[11px] text-blue-800">Folder ID: 1Gz4nGIrBVmlM9kwcnat_L9uedqmw4KyJ</span>
              </div>
            </div>
            <a
              href="https://drive.google.com/drive/folders/1Gz4nGIrBVmlM9kwcnat_L9uedqmw4KyJ?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-[11px] hover:bg-blue-700 transition-colors shrink-0"
            >
              <span>Buka GDrive</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block text-xs">Sekretariat K3RS</span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  Gedung Manajemen Lt. 2, RS Semen Gresik, Jl. R.A. Kartini No.280, Gresik
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start gap-2.5">
              <Phone className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 block text-xs">Kontak & Emergency</span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  Hotline K3: Ext. 211 / Code Red: Ext. 118
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-200 bg-slate-50">
          <button
            onClick={() => setIsHospitalInfoModalOpen(false)}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
