/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { K3Provider, useK3 } from './context/K3Context';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { RingkasanView } from './components/modules/RingkasanView';
import { ModuleChecklistView } from './components/modules/ModuleChecklistView';
import { ManageDocModal } from './components/modals/ManageDocModal';
import { DocViewerModal } from './components/modals/DocViewerModal';
import { ExportModal } from './components/modals/ExportModal';
import { HospitalInfoModal } from './components/modals/HospitalInfoModal';
import { GDriveConfigModal } from './components/modals/GDriveConfigModal';
import { ToastNotification } from './components/ToastNotification';
import { ShieldCheck, ExternalLink } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeModuleId,
    viewingDocState,
    setViewingDocState,
    deleteDocument,
    isGDriveConfigModalOpen,
    setIsGDriveConfigModalOpen,
  } = useK3();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Sidebar - Strictly 13 Patent Menus with independent scroll */}
      <Sidebar />

      {/* Main Content Area with independent scroll */}
      <div className="flex flex-1 flex-col h-screen overflow-y-auto min-w-0">
        {/* Top Navbar */}
        <TopNavbar />

        {/* Dynamic Module Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeModuleId === 'RINGKASAN' ? (
            <RingkasanView />
          ) : (
            <ModuleChecklistView moduleId={activeModuleId} />
          )}
        </main>

        {/* Official Hospital Footer */}
        <footer className="mt-auto shrink-0 border-t border-slate-200 bg-white px-6 py-4 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span className="font-semibold text-slate-700">
                Sistem Manajemen Keselamatan dan Kesehatan Kerja Rumah Sakit (SMK3RS)
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline text-slate-500">RS Semen Gresik</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>Standar MFK KARS & STARKES Kemenkes RI</span>
              <span aria-hidden="true">·</span>
              <a
                href="https://sites.google.com/view/manrisk-cng/unit-kerja"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-teal-700 transition-colors inline-flex items-center gap-1"
              >
                <span>Risk Register / IBR</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Interactive Modals */}
      <ManageDocModal />
      <DocViewerModal
        document={viewingDocState?.doc || null}
        requirementTitle={viewingDocState?.requirementTitle}
        requirementNumber={viewingDocState?.requirementNumber}
        onClose={() => setViewingDocState(null)}
        onDelete={
          viewingDocState?.itemId
            ? (docId) => deleteDocument(viewingDocState.itemId!, docId)
            : undefined
        }
      />
      <ExportModal />
      <HospitalInfoModal />
      <GDriveConfigModal
        isOpen={isGDriveConfigModalOpen}
        onClose={() => setIsGDriveConfigModalOpen(false)}
      />
      <ToastNotification />
    </div>
  );
};

export default function App() {
  return (
    <K3Provider>
      <MainLayout />
    </K3Provider>
  );
}
