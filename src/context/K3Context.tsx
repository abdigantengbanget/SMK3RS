import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, testFirestoreConnection, handleFirestoreError, OperationType } from '../services/firebase';
import { cleanForFirestore } from '../utils/cleanFirestore';
import { MasterChecklistItem, ComplianceStatus, DocumentEvidence, ModuleSummary } from '../types/k3';
import { INITIAL_MASTER_CHECKLIST } from '../data/masterChecklistData';
import { OFFICIAL_SIDEBAR_MENUS } from '../data/menuConfig';
import { storeFileBlob, getFileBlob, removeFileBlob } from '../utils/fileStorage';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  ensureGoogleAccessToken,
  clearAccessToken,
} from '../services/auth';
import {
  uploadFileToGoogleDriveFolder,
  uploadFileViaWebhook,
  deleteFileFromGoogleDrive,
} from '../services/gdriveService';

export const GDRIVE_MAIN_FOLDER_URL =
  'https://drive.google.com/drive/folders/1Gz4nGIrBVmlM9kwcnat_L9uedqmw4KyJ?usp=sharing';
export const GDRIVE_FOLDER_ID = '1Gz4nGIrBVmlM9kwcnat_L9uedqmw4KyJ';

export interface ToastNotificationState {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface ViewingDocState {
  doc: DocumentEvidence;
  requirementTitle?: string;
  requirementNumber?: string;
  itemId?: string;
}

interface K3ContextType {
  activeModuleId: string;
  setActiveModuleId: (id: string) => void;
  items: MasterChecklistItem[];
  updateItemStatus: (itemId: string, newStatus: ComplianceStatus, auditorNotes?: string) => void;
  uploadDocuments: (
    itemId: string,
    files: FileList | File[],
    customDocNumber?: string
  ) => Promise<{ uploadedCount: number; savedToGDrive: boolean }>;
  syncDocumentToGoogleDrive: (itemId: string, docId: string) => Promise<boolean>;
  syncAllPendingToGoogleDrive: (targetModuleId?: string) => Promise<number>;
  linkGDriveDocument: (
    itemId: string,
    name: string,
    gdriveUrl: string,
    customDocNumber?: string
  ) => void;
  deleteDocument: (itemId: string, docId: string) => Promise<void>;
  resetToDefaultData: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'terupload' | 'belum';
  setStatusFilter: (filter: 'all' | 'terupload' | 'belum') => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeDocModalItem: MasterChecklistItem | null;
  setActiveDocModalItem: (item: MasterChecklistItem | null) => void;
  viewingDocState: ViewingDocState | null;
  setViewingDocState: (state: ViewingDocState | null) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  isHospitalInfoModalOpen: boolean;
  setIsHospitalInfoModalOpen: (open: boolean) => void;
  isGDriveConfigModalOpen: boolean;
  setIsGDriveConfigModalOpen: (open: boolean) => void;
  gdriveWebhookUrl: string;
  setGdriveWebhookUrl: (url: string) => void;

  // Cloud Real-time Sync Status
  isCloudSynced: boolean;

  // Authentication & Google Drive Direct Connection
  currentUser: User | null;
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  handleGoogleLogin: () => Promise<boolean>;
  handleGoogleLogout: () => Promise<void>;
  gdriveMainFolderUrl: string;

  // Toast
  toast: ToastNotificationState | null;
  dismissToast: () => void;
  showToast: (
    type: 'success' | 'error' | 'info',
    message: string,
    actionUrl?: string,
    actionLabel?: string
  ) => void;

  stats: {
    totalItems: number;
    uploadedItemsCount: number;
    pendingItemsCount: number;
    uploadedPercentage: number;
    pendingPercentage: number;
    totalDocuments: number;
    gdriveDocsCount: number;
    pendingGDriveCount: number;
  };
  moduleSummaries: ModuleSummary[];
}

const STORAGE_KEY = 'k3rs_semen_gresik_checklist_v3_komite';

const K3Context = createContext<K3ContextType | undefined>(undefined);

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const K3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModuleId, setActiveModuleId] = useState<string>('RINGKASAN');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'terupload' | 'belum'>('all');
  const [activeDocModalItem, setActiveDocModalItem] = useState<MasterChecklistItem | null>(null);
  const [viewingDocState, setViewingDocState] = useState<ViewingDocState | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isHospitalInfoModalOpen, setIsHospitalInfoModalOpen] = useState<boolean>(false);
  const [isGDriveConfigModalOpen, setIsGDriveConfigModalOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastNotificationState | null>(null);

  const [gdriveWebhookUrl, setGdriveWebhookUrlState] = useState<string>(() => {
    try {
      return localStorage.getItem('k3rs_gdrive_webhook_url') || '';
    } catch {
      return '';
    }
  });

  const showToast = (
    type: 'success' | 'error' | 'info',
    message: string,
    actionUrl?: string,
    actionLabel?: string
  ) => {
    const newToast: ToastNotificationState = {
      id: String(Date.now()),
      type,
      message,
      actionUrl,
      actionLabel,
    };
    setToast(newToast);
    if (type !== 'error') {
      setTimeout(() => {
        setToast((current) => (current?.id === newToast.id ? null : current));
      }, 7000);
    }
  };

  const dismissToast = () => setToast(null);

  const setGdriveWebhookUrl = (url: string) => {
    setGdriveWebhookUrlState(url);
    try {
      if (url) {
        localStorage.setItem('k3rs_gdrive_webhook_url', url);
      } else {
        localStorage.removeItem('k3rs_gdrive_webhook_url');
      }
    } catch {
      // ignore
    }
  };

  // Google Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async (): Promise<boolean> => {
    try {
      setIsLoggingIn(true);
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
        showToast(
          'success',
          `✓ Berhasil terhubung dengan Google (${res.user.email}). File otomatis tersimpan ke folder Komite K3.`,
          GDRIVE_MAIN_FOLDER_URL,
          'Buka Drive'
        );
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('auth/unauthorized-domain')) {
        showToast(
          'error',
          'Domain Vercel belum diizinkan di Firebase: Tambahkan domain Vercel Anda di Firebase Console > Authentication > Settings > Authorized domains.'
        );
      } else {
        showToast(
          'error',
          `Gagal menghubungkan Google: ${err.message || 'Pop-up ditutup sebelum selesai.'}`
        );
      }
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      showToast('info', 'Berhasil keluar dari akun Google.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Items State (loaded from localStorage or initialized with clean 162 items)
  const [items, setItems] = useState<MasterChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved checklist items, initializing defaults:', e);
    }
    return INITIAL_MASTER_CHECKLIST;
  });

  // REAL-TIME FIRESTORE SYNCHRONIZATION:
  // When User 1 uploads a file or changes a status, User 2 sees it instantly via onSnapshot!
  useEffect(() => {
    testFirestoreConnection();

    const itemsCol = collection(db, 'checklist_items');

    const unsubscribe = onSnapshot(
      itemsCol,
      async (snapshot) => {
        if (snapshot.empty) {
          // If Firestore is empty, seed with initial 162 master checklist items
          console.log('Seeding initial master checklist to Firestore...');
          try {
            const batch = writeBatch(db);
            const sourceItems = items && items.length > 0 ? items : INITIAL_MASTER_CHECKLIST;
            sourceItems.forEach((item) => {
              const itemRef = doc(db, 'checklist_items', item.id);
              batch.set(itemRef, cleanForFirestore(item), { merge: true });
            });
            await batch.commit();
            setIsCloudSynced(true);
          } catch (seedErr) {
            console.warn('Failed to seed initial checklist to Firestore:', seedErr);
            handleFirestoreError(seedErr, OperationType.WRITE, 'checklist_items');
          }
        } else {
          // Map remote items
          const remoteMap = new Map<string, MasterChecklistItem>();
          snapshot.docs.forEach((d) => {
            remoteMap.set(d.id, d.data() as MasterChecklistItem);
          });

          // Maintain strict canonical order from INITIAL_MASTER_CHECKLIST
          const orderedItems = INITIAL_MASTER_CHECKLIST.map((initialItem) => {
            const remoteItem = remoteMap.get(initialItem.id);
            return remoteItem || initialItem;
          });

          setItems(orderedItems);
          setIsCloudSynced(true);

          // Keep active modal item in sync if open
          setActiveDocModalItem((current) => {
            if (!current) return null;
            return remoteMap.get(current.id) || current;
          });
        }
      },
      (error) => {
        console.warn('Real-time Firestore listener notice (offline fallback):', error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Save items to localStorage as offline cache whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [items]);

  // Handle URL hash / path synchronization
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash.replace('#', '');
      const current = hash || path;

      if (!current || current === '/' || current.includes('RINGKASAN')) {
        setActiveModuleId('RINGKASAN');
        return;
      }

      const match = OFFICIAL_SIDEBAR_MENUS.find(m => m.path === current || current.endsWith(m.id));
      if (match && !match.isExternal) {
        setActiveModuleId(match.id);
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleSetActiveModuleId = (id: string) => {
    setActiveModuleId(id);
    const menu = OFFICIAL_SIDEBAR_MENUS.find(m => m.id === id);
    if (menu && !menu.isExternal) {
      window.history.pushState({}, '', menu.path === '/' ? '/' : `#${menu.path}`);
    }
    setIsMobileSidebarOpen(false);
  };

  const updateItemStatus = async (itemId: string, newStatus: ComplianceStatus, auditorNotes?: string) => {
    const nowStr = new Date().toISOString().split('T')[0];

    // 1. Optimistic local update
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            status: newStatus,
            lastUpdated: nowStr,
            notes: auditorNotes !== undefined ? auditorNotes : item.notes,
          };
        }
        return item;
      })
    );

    // 2. Real-time Cloud update to Firestore -> Pushes instantly to all other users!
    try {
      const itemRef = doc(db, 'checklist_items', itemId);
      const updateData: Record<string, any> = {
        status: newStatus,
        lastUpdated: nowStr,
      };
      if (auditorNotes !== undefined) {
        updateData.notes = auditorNotes;
      }
      await setDoc(itemRef, cleanForFirestore(updateData), { merge: true });
      console.log('Real-time Firestore status update saved for', itemId);
    } catch (err) {
      console.error('Firestore updateItemStatus sync error:', err);
    }
  };

  // Upload files: uploads to real-time Cloud Firestore & IndexedDB so all users see it immediately
  const uploadDocuments = async (
    itemId: string,
    files: FileList | File[],
    customDocNumber?: string
  ): Promise<{ uploadedCount: number; savedToGDrive: boolean }> => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return { uploadedCount: 0, savedToGDrive: false };

    // Check optional Google Drive token
    const token = await getAccessToken();

    const newDocs: DocumentEvidence[] = [];
    const nowStr = new Date().toISOString().split('T')[0];
    let anyGDriveSuccess = false;
    let driveErrorMessage = '';

    for (const file of fileArray) {
      const docId = `DOC-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const fileExt = file.name.split('.').pop()?.toUpperCase() || 'FILE';

      // Save locally in IndexedDB AND to Firestore file_storage for real-time multi-user viewing!
      const dataUrl = await storeFileBlob(docId, file, { name: file.name, mimeType: file.type });

      let isGDrive = false;
      let gdriveUrl = '';

      // Google Drive Upload: Try OAuth token first, then fallback to direct Apps Script Webhook
      let gdriveResult: any = null;
      if (token) {
        try {
          gdriveResult = await uploadFileToGoogleDriveFolder(
            file,
            file.name,
            GDRIVE_FOLDER_ID,
            token,
            customDocNumber
          );
        } catch (tokenErr) {
          console.warn('OAuth direct upload notice, falling back to webhook:', tokenErr);
        }
      }

      // If token not present or direct upload failed, use Webhook (direct to Komite K3 folder)
      if (!gdriveResult) {
        try {
          gdriveResult = await uploadFileViaWebhook(file, file.name, customDocNumber);
        } catch (webhookErr: any) {
          console.warn('Google Drive webhook upload notice:', webhookErr);
          driveErrorMessage = webhookErr.message || 'Gagal menyimpan ke Google Drive';
        }
      }

      if (gdriveResult?.webViewLink) {
        isGDrive = true;
        gdriveUrl = gdriveResult.webViewLink;
        anyGDriveSuccess = true;
      }

      newDocs.push({
        id: docId,
        name: file.name,
        docNumber: customDocNumber?.trim() || `DOK-${fileExt}-${Date.now().toString().slice(-4)}`,
        uploadDate: nowStr,
        fileType: fileExt,
        fileSize: formatFileSize(file.size),
        mimeType: file.type || 'application/octet-stream',
        dataUrl: dataUrl && dataUrl.length < 500000 ? dataUrl : undefined,
        isGDrive: !!isGDrive,
        gdriveUrl: gdriveUrl || '',
        verified: true,
      });
    }

    // 1. Optimistic local update
    const currentItem = items.find(i => i.id === itemId);
    const updatedDocs = [...newDocs, ...(currentItem?.documents || [])];

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            documents: updatedDocs,
            status: 'lengkap',
            lastUpdated: nowStr,
            verifiedBy: currentUser?.displayName || 'Verifikator K3RS',
          };
        }
        return item;
      })
    );

    setActiveDocModalItem(prev => {
      if (prev && prev.id === itemId) {
        return {
          ...prev,
          documents: updatedDocs,
          status: 'lengkap',
          lastUpdated: nowStr,
          verifiedBy: currentUser?.displayName || 'Verifikator K3RS',
        };
      }
      return prev;
    });

    // 2. Real-time Cloud update to Firestore -> Pushes instantly to all other users!
    try {
      const itemRef = doc(db, 'checklist_items', itemId);
      const payload = cleanForFirestore({
        documents: updatedDocs,
        status: 'lengkap',
        lastUpdated: nowStr,
        verifiedBy: currentUser?.displayName || 'Verifikator K3RS',
      });
      await setDoc(itemRef, payload, { merge: true });
      console.log('Real-time Firestore upload saved successfully for', itemId);
    } catch (firestoreErr) {
      console.error('Firestore real-time update error:', firestoreErr);
    }

    // Provide explicit user feedback
    showToast(
      'success',
      anyGDriveSuccess
        ? `✓ ${newDocs.length} berkas berhasil tersimpan di Google Drive Komite K3 & tersinkron realtime!`
        : `✓ ${newDocs.length} berkas berhasil diunggah & tersinkronisasi realtime ke semua pengguna!`,
      anyGDriveSuccess ? GDRIVE_MAIN_FOLDER_URL : undefined,
      anyGDriveSuccess ? 'Buka Google Drive' : undefined
    );

    return { uploadedCount: newDocs.length, savedToGDrive: anyGDriveSuccess };
  };

  // Sync a single document from IndexedDB directly to Google Drive
  const syncDocumentToGoogleDrive = async (itemId: string, docId: string): Promise<boolean> => {
    const item = items.find(i => i.id === itemId);
    const doc = item?.documents.find(d => d.id === docId);
    if (!item || !doc) return false;

    try {
      const blob = await getFileBlob(docId);
      if (!blob) {
        showToast('error', `Data berkas ${doc.name} tidak ditemukan di penyimpanan lokal.`);
        return false;
      }

      showToast('info', `Sedang mengunggah ${doc.name} ke folder Google Drive Komite K3...`);
      
      let gdriveResult: any = null;
      try {
        gdriveResult = await uploadFileViaWebhook(blob, doc.name, doc.docNumber);
      } catch (webhookErr) {
        console.warn('Webhook sync fallback to token:', webhookErr);
        let token = await getAccessToken();
        if (!token) {
          const signResult = await googleSignIn();
          token = signResult?.accessToken || null;
        }
        if (token) {
          gdriveResult = await uploadFileToGoogleDriveFolder(
            blob,
            doc.name,
            GDRIVE_FOLDER_ID,
            token,
            doc.docNumber
          );
        } else {
          throw webhookErr;
        }
      }

      setItems(prevItems =>
        prevItems.map(it => {
          if (it.id === itemId) {
            return {
              ...it,
              documents: it.documents.map(d =>
                d.id === docId
                  ? { ...d, isGDrive: true, gdriveUrl: gdriveResult.webViewLink }
                  : d
              ),
            };
          }
          return it;
        })
      );

      showToast(
        'success',
        `✓ Berkas "${doc.name}" berhasil tersimpan di folder Google Drive Komite K3!`,
        gdriveResult.webViewLink || GDRIVE_MAIN_FOLDER_URL,
        'Lihat di Google Drive'
      );
      return true;
    } catch (err: any) {
      console.error('Sync to GDrive failed:', err);
      showToast('error', `Gagal menyimpan ke Google Drive: ${err.message}`);
      return false;
    }
  };

  // Sync all locally stored documents to Google Drive in batch
  const syncAllPendingToGoogleDrive = async (targetModuleId?: string): Promise<number> => {
    let token = await getAccessToken();
    if (!token) {
      try {
        const signResult = await googleSignIn();
        if (signResult) {
          token = signResult.accessToken;
          setCurrentUser(signResult.user);
        }
      } catch {
        // Will continue with webhook fallback
      }
    }

    let syncedCount = 0;
    showToast('info', 'Memulai sinkronisasi seluruh berkas ke folder Google Drive Komite K3...');

    const updatedItems = await Promise.all(
      items.map(async (item) => {
        if (targetModuleId && item.moduleId !== targetModuleId) {
          return item;
        }

        const updatedDocs = await Promise.all(
          item.documents.map(async (doc) => {
            if (doc.isGDrive && doc.gdriveUrl) return doc;
            try {
              const blob = await getFileBlob(doc.id);
              if (blob) {
                let res: any = null;
                if (token) {
                  try {
                    res = await uploadFileToGoogleDriveFolder(
                      blob,
                      doc.name,
                      GDRIVE_FOLDER_ID,
                      token,
                      doc.docNumber
                    );
                  } catch (err) {
                    console.warn(`OAuth token upload failed for ${doc.name}, trying webhook:`, err);
                  }
                }
                if (!res) {
                  res = await uploadFileViaWebhook(blob, doc.name, doc.docNumber);
                }
                if (res?.webViewLink) {
                  syncedCount++;
                  return {
                    ...doc,
                    isGDrive: true,
                    gdriveUrl: res.webViewLink,
                  };
                }
              }
            } catch (err) {
              console.warn(`Sync failed for ${doc.name}:`, err);
            }
            return doc;
          })
        );

        return {
          ...item,
          documents: updatedDocs,
        };
      })
    );

    setItems(updatedItems);

    // Persist updated GDrive links to Firestore
    try {
      const batch = writeBatch(db);
      updatedItems.forEach((item) => {
        if (!targetModuleId || item.moduleId === targetModuleId) {
          const itemRef = doc(db, 'checklist_items', item.id);
          batch.set(itemRef, cleanForFirestore(item), { merge: true });
        }
      });
      await batch.commit();
    } catch (firestoreErr) {
      console.warn('Batch Firestore update after GDrive sync notice:', firestoreErr);
    }

    if (syncedCount > 0) {
      showToast(
        'success',
        `✓ ${syncedCount} berkas berhasil tersimpan di folder Google Drive Komite K3!`,
        GDRIVE_MAIN_FOLDER_URL,
        'Buka Google Drive'
      );
    } else {
      showToast('info', 'Semua berkas yang tersedia sudah tersimpan di Google Drive.');
    }

    return syncedCount;
  };

  // Link document from Google Drive folder
  const linkGDriveDocument = async (
    itemId: string,
    name: string,
    gdriveUrl: string,
    customDocNumber?: string
  ) => {
    if (!name.trim() || !gdriveUrl.trim()) return;

    const docId = `GDRIVE-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const nowStr = new Date().toISOString().split('T')[0];

    const newDoc: DocumentEvidence = {
      id: docId,
      name: name.trim(),
      docNumber: customDocNumber?.trim() || `GDRIVE-${Date.now().toString().slice(-4)}`,
      uploadDate: nowStr,
      fileType: 'GDRIVE',
      fileSize: 'Google Drive',
      isGDrive: true,
      gdriveUrl: gdriveUrl.trim(),
      verified: true,
    };

    const currentItem = items.find(i => i.id === itemId);
    const updatedDocs = [newDoc, ...(currentItem?.documents || [])];

    // Optimistic local update
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            documents: updatedDocs,
            status: 'lengkap',
            lastUpdated: nowStr,
            verifiedBy: currentUser?.displayName || 'Verifikator K3RS',
          };
        }
        return item;
      })
    );

    setActiveDocModalItem(prev => {
      if (prev && prev.id === itemId) {
        return {
          ...prev,
          documents: updatedDocs,
          status: 'lengkap',
          lastUpdated: nowStr,
          verifiedBy: currentUser?.displayName || 'Verifikator K3RS',
        };
      }
      return prev;
    });

    // Real-time Cloud update to Firestore -> Pushes instantly to all other users!
    try {
      const itemRef = doc(db, 'checklist_items', itemId);
      const payload = cleanForFirestore({
        documents: updatedDocs,
        status: 'lengkap',
        lastUpdated: nowStr,
        verifiedBy: currentUser?.displayName || 'Verifikator K3RS',
      });
      await setDoc(itemRef, payload, { merge: true });
      console.log('Real-time Firestore linkGDrive saved successfully for', itemId);
    } catch (firestoreErr) {
      console.error('Firestore real-time linkGDrive sync error:', firestoreErr);
    }

    showToast('success', '✓ Dokumen Google Drive berhasil ditautkan & tersinkronisasi realtime!');
  };

  const deleteDocument = async (itemId: string, docId: string) => {
    const currentItem =
      activeDocModalItem?.id === itemId
        ? activeDocModalItem
        : items.find((i) => i.id === itemId);
    const targetDoc = currentItem?.documents.find((d) => d.id === docId);

    // Delete in Google Drive if ID can be found
    if (targetDoc?.isGDrive && targetDoc.gdriveUrl) {
      const match = targetDoc.gdriveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        try {
          const token = await getAccessToken();
          if (token) {
            await deleteFileFromGoogleDrive(match[1], token);
          }
        } catch (err) {
          console.warn('Google Drive delete remote notice:', err);
        }
      }
    }

    if (!docId.startsWith('GDRIVE-')) {
      await removeFileBlob(docId);
    }

    const nowStr = new Date().toISOString().split('T')[0];
    const remainingDocs = (currentItem?.documents || []).filter((d) => d.id !== docId);

    // Optimistic local update
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            documents: remainingDocs,
            status: remainingDocs.length > 0 ? item.status : 'belum',
            lastUpdated: nowStr,
          };
        }
        return item;
      })
    );

    setActiveDocModalItem((prev) => {
      if (prev && prev.id === itemId) {
        return {
          ...prev,
          documents: remainingDocs,
          status: remainingDocs.length > 0 ? prev.status : 'belum',
        };
      }
      return prev;
    });

    // Update localStorage cache immediately
    try {
      const updatedList = items.map((it) =>
        it.id === itemId
          ? {
              ...it,
              documents: remainingDocs,
              status: remainingDocs.length > 0 ? it.status : 'belum',
              lastUpdated: nowStr,
            }
          : it
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    // Real-time Cloud update to Firestore -> Pushes deletion to all users instantly!
    try {
      const itemRef = doc(db, 'checklist_items', itemId);
      const payload = cleanForFirestore({
        documents: remainingDocs,
        status: remainingDocs.length > 0 ? currentItem?.status || 'lengkap' : 'belum',
        lastUpdated: nowStr,
      });
      await setDoc(itemRef, payload, { merge: true });
      console.log('Real-time Firestore deleteDocument saved successfully for', itemId);
    } catch (firestoreErr) {
      console.error('Firestore deleteDocument sync error:', firestoreErr);
    }

    showToast('info', 'Dokumen berhasil dihapus dari cloud & checklist.');
  };

  const resetToDefaultData = async () => {
    setItems(INITIAL_MASTER_CHECKLIST);
    try {
      localStorage.removeItem(STORAGE_KEY);
      const batch = writeBatch(db);
      INITIAL_MASTER_CHECKLIST.forEach((item) => {
        const itemRef = doc(db, 'checklist_items', item.id);
        batch.set(itemRef, cleanForFirestore(item), { merge: true });
      });
      await batch.commit();
    } catch (err) {
      console.warn('Firestore reset warning:', err);
    }
    showToast('info', 'Checklist direset ke kondisi awal 0% untuk seluruh pengguna.');
  };

  // Global statistics calculation: % terupload dan % belum
  const stats = useMemo(() => {
    const totalItems = items.length;
    let uploadedItemsCount = 0;
    let pendingItemsCount = 0;
    let totalDocuments = 0;
    let gdriveDocsCount = 0;

    items.forEach(item => {
      const docCount = item.documents.length;
      totalDocuments += docCount;
      gdriveDocsCount += item.documents.filter(d => d.isGDrive).length;
      if (docCount > 0) {
        uploadedItemsCount++;
      } else {
        pendingItemsCount++;
      }
    });

    const uploadedPercentage = totalItems > 0 ? Math.round((uploadedItemsCount / totalItems) * 100) : 0;
    const pendingPercentage = 100 - uploadedPercentage;
    const pendingGDriveCount = totalDocuments - gdriveDocsCount;

    return {
      totalItems,
      uploadedItemsCount,
      pendingItemsCount,
      uploadedPercentage,
      pendingPercentage,
      totalDocuments,
      gdriveDocsCount,
      pendingGDriveCount,
    };
  }, [items]);

  // Per-module summaries: % terupload dan % belum for each of the 11 internal modules
  const moduleSummaries = useMemo<ModuleSummary[]>(() => {
    return OFFICIAL_SIDEBAR_MENUS
      .filter(m => m.id !== 'RINGKASAN' && !m.isExternal)
      .map(menu => {
        const moduleItems = items.filter(item => item.moduleId === menu.id);
        const total = moduleItems.length;
        const uploaded = moduleItems.filter(i => i.documents.length > 0).length;
        const pending = total - uploaded;
        const uploadedPercentage = total > 0 ? Math.round((uploaded / total) * 100) : 0;
        const pendingPercentage = 100 - uploadedPercentage;
        const totalDocsInModule = moduleItems.reduce((acc, curr) => acc + curr.documents.length, 0);

        return {
          moduleId: menu.id,
          moduleName: menu.name,
          totalItems: total,
          uploadedCount: uploaded,
          pendingCount: pending,
          uploadedPercentage,
          pendingPercentage,
          totalDocuments: totalDocsInModule,
        };
      });
  }, [items]);

  return (
    <K3Context.Provider
      value={{
        activeModuleId,
        setActiveModuleId: handleSetActiveModuleId,
        items,
        updateItemStatus,
        uploadDocuments,
        syncDocumentToGoogleDrive,
        syncAllPendingToGoogleDrive,
        linkGDriveDocument,
        deleteDocument,
        resetToDefaultData,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        activeDocModalItem,
        setActiveDocModalItem,
        viewingDocState,
        setViewingDocState,
        isExportModalOpen,
        setIsExportModalOpen,
        isHospitalInfoModalOpen,
        setIsHospitalInfoModalOpen,
        isGDriveConfigModalOpen,
        setIsGDriveConfigModalOpen,
        gdriveWebhookUrl,
        setGdriveWebhookUrl,

        // Cloud Real-time Sync Status
        isCloudSynced,

        // Authentication & Google Drive
        currentUser,
        isLoggedIn: !!currentUser,
        isLoggingIn,
        handleGoogleLogin,
        handleGoogleLogout,
        gdriveMainFolderUrl: GDRIVE_MAIN_FOLDER_URL,

        toast,
        dismissToast,
        showToast,

        stats,
        moduleSummaries,
      }}
    >
      {children}
    </K3Context.Provider>
  );
};

export const useK3 = () => {
  const context = useContext(K3Context);
  if (!context) {
    throw new Error('useK3 must be used within a K3Provider');
  }
  return context;
};
