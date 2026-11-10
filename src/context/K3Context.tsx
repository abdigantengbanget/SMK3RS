import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
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
  ensureFirebaseUser,
  clearAccessToken,
} from '../services/auth';
import {
  uploadFileToGoogleDriveFolder,
  uploadFileViaWebhook,
  deleteFileFromGoogleDrive,
} from '../services/gdriveService';
import type { SharedUpload } from '../services/checklistSync';

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
  isGDriveConfigModalOpen: boolean;
  setIsGDriveConfigModalOpen: (open: boolean) => void;
  gdriveWebhookUrl: string;
  setGdriveWebhookUrl: (url: string) => void;

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
      await ensureFirebaseUser();
      showToast('info', 'Berhasil keluar dari akun Google.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

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
  const sharedUploadsRef = useRef<Map<string, SharedUpload>>(new Map());
  const ownUploadIdsRef = useRef(new Set<string>());
  const hasReportedSyncErrorRef = useRef(false);

  // Save items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [items]);

  useEffect(() => {
    let isActive = true;
    let unsubscribe: (() => void) | undefined;
    const handleSyncError = (error: Error) => {
      console.error('Shared upload sync failed:', error);
      if (!hasReportedSyncErrorRef.current) {
        hasReportedSyncErrorRef.current = true;
        showToast(
          'error',
          'Sinkronisasi update antar pengguna gagal. Pastikan Firestore dan login anonim sudah diaktifkan di Firebase.'
        );
      }
    };

    import('../services/checklistSync')
      .then(({ subscribeToSharedUploads }) => {
        if (!isActive) return;
        unsubscribe = subscribeToSharedUploads(
          (uploads, newlyUploaded) => {
            const previousUploads = sharedUploadsRef.current;
            const nextUploads = new Map(uploads.map((upload) => [upload.document.id, upload]));
            sharedUploadsRef.current = nextUploads;
            const newlyUploadedIds = new Set(
              newlyUploaded.map((upload) => upload.document.id)
            );
            uploads.forEach((upload) => {
              if (!newlyUploadedIds.has(upload.document.id)) {
                ownUploadIdsRef.current.delete(upload.document.id);
              }
            });

            const mergeSharedUploads = (item: MasterChecklistItem): MasterChecklistItem => {
              const localDocuments = item.documents.filter(
                (document) =>
                  !previousUploads.has(document.id) && !nextUploads.has(document.id)
              );
              const sharedDocuments = uploads
                .filter((upload) => upload.itemId === item.id)
                .map((upload) => {
                  const localDocument = item.documents.find(
                    (document) => document.id === upload.document.id
                  );
                  return localDocument?.dataUrl
                    ? { ...upload.document, dataUrl: localDocument.dataUrl }
                    : upload.document;
                });

              return {
                ...item,
                documents: [...sharedDocuments, ...localDocuments],
                status: sharedDocuments.length > 0 ? 'lengkap' : item.status,
              };
            };

            setItems((currentItems) => currentItems.map(mergeSharedUploads));
            setActiveDocModalItem((currentItem) =>
              currentItem ? mergeSharedUploads(currentItem) : currentItem
            );

            newlyUploaded.forEach((upload) => {
              if (ownUploadIdsRef.current.delete(upload.document.id)) return;
              const item = INITIAL_MASTER_CHECKLIST.find(
                (checklistItem) => checklistItem.id === upload.itemId
              );
              showToast(
                'info',
                `${upload.uploadedBy} mengunggah ${upload.document.name}${
                  item ? ` — ${item.title}` : ''
                }.`,
                upload.document.gdriveUrl,
                upload.document.gdriveUrl ? 'Buka berkas' : undefined
              );
            });
          },
          handleSyncError
        );
      })
      .catch((error: unknown) =>
        handleSyncError(error instanceof Error ? error : new Error(String(error)))
      );

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, []);

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

  const updateItemStatus = (itemId: string, newStatus: ComplianceStatus, auditorNotes?: string) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const nowStr = new Date().toISOString().split('T')[0];
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
  };

  // Upload files: automatically ensures Google Drive authentication and uploads directly to Google Drive folder 1Gz4nGIrBVmlM9kwcnat_L9uedqmw4KyJ
  const uploadDocuments = async (
    itemId: string,
    files: FileList | File[],
    customDocNumber?: string
  ): Promise<{ uploadedCount: number; savedToGDrive: boolean }> => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return { uploadedCount: 0, savedToGDrive: false };

    // 1. Check if user is already authenticated with Google Drive
    const token = await getAccessToken();

    const newDocs: DocumentEvidence[] = [];
    const nowStr = new Date().toISOString().split('T')[0];
    let anyGDriveSuccess = false;
    let driveErrorMessage = '';

    for (const file of fileArray) {
      const docId = `DOC-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const fileExt = file.name.split('.').pop()?.toUpperCase() || 'FILE';

      // Always save locally in IndexedDB for instant offline preview & backup
      await storeFileBlob(docId, file);

      let isGDrive = false;
      let gdriveUrl = '';

      // Direct Automatic Upload to Google Drive folder K3 RS via Webhook (Zero login required for all hospital staff)
      try {
        const webhookResult = await uploadFileViaWebhook(file, file.name, customDocNumber);
        if (webhookResult?.webViewLink) {
          isGDrive = true;
          gdriveUrl = webhookResult.webViewLink;
          anyGDriveSuccess = true;
        }
      } catch (webhookErr: any) {
        console.warn('Webhook upload fallback:', webhookErr);
        // Fallback to token-based upload if available
        if (token) {
          try {
            const gdriveResult = await uploadFileToGoogleDriveFolder(
              file,
              file.name,
              GDRIVE_FOLDER_ID,
              token,
              customDocNumber
            );
            if (gdriveResult?.webViewLink) {
              isGDrive = true;
              gdriveUrl = gdriveResult.webViewLink;
              anyGDriveSuccess = true;
            }
          } catch (driveErr: any) {
            console.error('Direct Google Drive upload error:', driveErr);
            driveErrorMessage = driveErr.message || 'Gagal menyimpan ke Google Drive';
          }
        } else {
          driveErrorMessage = webhookErr.message;
        }
      }

      let dataUrl: string | undefined = undefined;
      if (file.type.startsWith('image/') && file.size < 2 * 1024 * 1024) {
        try {
          dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        } catch {
          // ignore
        }
      }

      newDocs.push({
        id: docId,
        name: file.name,
        docNumber: customDocNumber?.trim() || `DOK-${fileExt}-${Date.now().toString().slice(-4)}`,
        uploadDate: nowStr,
        fileType: fileExt,
        fileSize: formatFileSize(file.size),
        mimeType: file.type || 'application/octet-stream',
        dataUrl,
        isGDrive,
        gdriveUrl,
        verified: true,
      });
    }

    // Update state
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const updatedDocs = [...newDocs, ...item.documents];
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
        const updatedDocs = [...newDocs, ...prev.documents];
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

    const sharedDocuments = newDocs.filter((document) => document.isGDrive);
    sharedDocuments.forEach((document) => ownUploadIdsRef.current.add(document.id));
    const sharedUploadResults = await Promise.allSettled(
      sharedDocuments.map((document) =>
        import('../services/checklistSync').then(({ publishSharedUpload }) =>
          publishSharedUpload(itemId, document, currentUser?.displayName || 'Pengguna')
        )
      )
    );
    const failedSharedUploads = sharedUploadResults
      .map((result, index) => ({ result, document: sharedDocuments[index] }))
      .filter(
        (entry): entry is { result: PromiseRejectedResult; document: DocumentEvidence } =>
          entry.result.status === 'rejected'
      );
    failedSharedUploads.forEach(({ document }) => ownUploadIdsRef.current.delete(document.id));

    // Provide explicit user feedback
    if (failedSharedUploads.length > 0) {
      const error = failedSharedUploads[0].result.reason;
      console.error('Failed to publish upload update:', error);
      showToast(
        'error',
        `${newDocs.length} berkas diproses, tetapi update tidak tersinkron ke pengguna lain: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } else if (anyGDriveSuccess) {
      showToast(
        'success',
        `✓ ${newDocs.length} berkas berhasil tersimpan di Google Drive!`,
        GDRIVE_MAIN_FOLDER_URL,
        'Buka di Google Drive'
      );
    } else if (driveErrorMessage) {
      if (driveErrorMessage.includes('insufficient') || driveErrorMessage.includes('scope')) {
        clearAccessToken();
        showToast(
          'error',
          'Sesi login Google sebelumnya belum menyetujui izin Google Drive. Silakan klik tombol "Hubungkan Drive" di pojok kanan atas untuk menghubungkan ulang.'
        );
      } else {
        showToast(
          'error',
          `Berkas disimpan di lokal, tetapi gagal dikirim ke Google Drive: ${driveErrorMessage}`
        );
      }
    } else {
      showToast(
        'success',
        `✓ ${newDocs.length} berkas bukti berhasil diunggah ke checklist!`
      );
    }

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

      const sharedDocument = {
        ...doc,
        isGDrive: true,
        gdriveUrl: gdriveResult.webViewLink,
      };
      ownUploadIdsRef.current.add(docId);
      let sharedSyncFailed = false;
      try {
        const { publishSharedUpload } = await import('../services/checklistSync');
        await publishSharedUpload(
          itemId,
          sharedDocument,
          currentUser?.displayName || 'Pengguna'
        );
      } catch (syncError) {
        sharedSyncFailed = true;
        ownUploadIdsRef.current.delete(docId);
        console.error('Failed to publish synced document:', syncError);
      }

      if (sharedSyncFailed) {
        showToast(
          'error',
          `Berkas tersimpan di Google Drive, tetapi update tidak tersinkron ke pengguna lain.`
        );
      } else {
        showToast(
          'success',
          `✓ Berkas "${doc.name}" berhasil tersimpan di folder Google Drive Komite K3!`,
          gdriveResult.webViewLink || GDRIVE_MAIN_FOLDER_URL,
          'Lihat di Google Drive'
        );
      }
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
        showToast('error', 'Login Google diperlukan untuk sinkronisasi Google Drive.');
        return 0;
      }
    }

    if (!token) {
      showToast('error', 'Token Google Drive tidak tersedia.');
      return 0;
    }

    let syncedCount = 0;
    showToast('info', 'Memulai sinkronisasi seluruh berkas ke folder Google Drive...');

    const updatedItems = await Promise.all(
      items.map(async (item) => {
        if (targetModuleId && item.moduleId !== targetModuleId) {
          return item;
        }

        const updatedDocs = await Promise.all(
          item.documents.map(async (doc) => {
            if (doc.isGDrive) return doc;
            try {
              const blob = await getFileBlob(doc.id);
              if (blob) {
                const res = await uploadFileToGoogleDriveFolder(
                  blob,
                  doc.name,
                  GDRIVE_FOLDER_ID,
                  token!,
                  doc.docNumber
                );
                syncedCount++;
                return {
                  ...doc,
                  isGDrive: true,
                  gdriveUrl: res.webViewLink,
                };
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

    const syncedDocuments = updatedItems.flatMap((item) =>
      item.documents
        .filter((document) => {
          const previous = items
            .find((previousItem) => previousItem.id === item.id)
            ?.documents.find((previousDocument) => previousDocument.id === document.id);
          return document.isGDrive && !previous?.isGDrive;
        })
        .map((document) => ({ itemId: item.id, document }))
    );
    syncedDocuments.forEach(({ document }) =>
      ownUploadIdsRef.current.add(document.id)
    );
    const syncResults = await Promise.allSettled(
      syncedDocuments.map(({ itemId, document }) =>
        import('../services/checklistSync').then(({ publishSharedUpload }) =>
          publishSharedUpload(itemId, document, currentUser?.displayName || 'Pengguna')
        )
      )
    );
    const hasSharedSyncFailure = syncResults.some(
      (result) => result.status === 'rejected'
    );
    syncResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        ownUploadIdsRef.current.delete(syncedDocuments[index].document.id);
        console.error('Failed to publish synced document:', result.reason);
      }
    });

    if (syncedCount > 0) {
      if (hasSharedSyncFailure) {
        showToast(
          'error',
          `${syncedCount} berkas tersimpan di Google Drive, tetapi sebagian update tidak tersinkron ke pengguna lain.`
        );
      } else {
        showToast(
          'success',
          `✓ ${syncedCount} berkas berhasil tersimpan di folder Google Drive Komite K3!`,
          GDRIVE_MAIN_FOLDER_URL,
          'Buka Google Drive'
        );
      }
    } else {
      showToast('info', 'Semua berkas yang tersedia sudah tersimpan di Google Drive.');
    }

    return syncedCount;
  };

  // Link document from Google Drive folder
  const linkGDriveDocument = (
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

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const updatedDocs = [newDoc, ...item.documents];
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
        const updatedDocs = [newDoc, ...prev.documents];
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

    ownUploadIdsRef.current.add(newDoc.id);
    import('../services/checklistSync')
      .then(({ publishSharedUpload }) =>
        publishSharedUpload(itemId, newDoc, currentUser?.displayName || 'Pengguna')
      )
      .catch((error: unknown) => {
        ownUploadIdsRef.current.delete(newDoc.id);
        console.error('Failed to publish linked Google Drive document:', error);
        showToast(
          'error',
          `Berkas ditautkan, tetapi update tidak tersinkron ke pengguna lain: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      });
  };

  const deleteDocument = async (itemId: string, docId: string) => {
    const targetItem = items.find((i) => i.id === itemId);
    const targetDoc = targetItem?.documents.find((d) => d.id === docId);

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

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const remainingDocs = item.documents.filter(d => d.id !== docId);
          return {
            ...item,
            documents: remainingDocs,
            status: remainingDocs.length > 0 ? item.status : 'belum',
            lastUpdated: new Date().toISOString().split('T')[0],
          };
        }
        return item;
      })
    );

    setActiveDocModalItem(prev => {
      if (prev && prev.id === itemId) {
        const remainingDocs = prev.documents.filter(d => d.id !== docId);
        return {
          ...prev,
          documents: remainingDocs,
          status: remainingDocs.length > 0 ? prev.status : 'belum',
        };
      }
      return prev;
    });

    if (sharedUploadsRef.current.has(docId)) {
      import('../services/checklistSync')
        .then(({ removeSharedUpload }) => removeSharedUpload(docId))
        .catch((error: unknown) => {
          console.error('Failed to remove shared upload:', error);
          showToast(
            'error',
            `Dokumen dihapus di perangkat ini, tetapi update penghapusan gagal disinkronkan: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        });
    }

    showToast('info', 'Dokumen berhasil dihapus.');
  };

  const resetToDefaultData = () => {
    setItems(INITIAL_MASTER_CHECKLIST);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    showToast('info', 'Checklist direset ke kondisi awal 0%.');
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
        isGDriveConfigModalOpen,
        setIsGDriveConfigModalOpen,
        gdriveWebhookUrl,
        setGdriveWebhookUrl,

        // Authentication & Google Drive
        currentUser,
        isLoggedIn: !!currentUser && !currentUser.isAnonymous,
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
