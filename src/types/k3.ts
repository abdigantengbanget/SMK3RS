/**
 * Types for Dashboard Digital K3RS RS Semen Gresik
 */

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  isExternal?: boolean;
  externalUrl?: string;
  checklistMapping: string;
  description: string;
  iconName: string;
}

export type ComplianceStatus = 'lengkap' | 'proses' | 'belum';

export interface DocumentEvidence {
  id: string;
  name: string;
  docNumber: string;
  uploadDate: string;
  fileType: string;
  fileSize: string;
  mimeType?: string;
  dataUrl?: string; // base64 preview for images/small docs
  isGDrive?: boolean;
  gdriveUrl?: string;
  verified?: boolean;
}

export interface MasterChecklistItem {
  id: string;
  moduleId: string; // matches MenuItem.id (e.g. 'K3-KESELAMATAN', 'K3-B3', etc.)
  standardNumber: string; // e.g. "3.1.1", "5.1.4", "KK.1", "11.1", "D.1", "L.1"
  title: string;
  isSectionHeader?: boolean;
  description?: string;
  regulationRef?: string;
  picUnit?: string;
  status: ComplianceStatus;
  lastUpdated?: string;
  verifiedBy?: string;
  notes?: string;
  documents: DocumentEvidence[];
}

export interface ModuleSummary {
  moduleId: string;
  moduleName: string;
  totalItems: number;
  uploadedCount: number; // Number of requirements with at least 1 file uploaded/linked
  pendingCount: number; // Number of requirements with 0 files uploaded
  uploadedPercentage: number; // e.g. 25%
  pendingPercentage: number; // e.g. 75%
  totalDocuments: number; // Total number of uploaded/linked files across this module
}
