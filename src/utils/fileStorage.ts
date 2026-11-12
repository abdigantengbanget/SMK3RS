/**
 * Hybrid storage helper for uploaded files:
 * 1. IndexedDB on local browser for ultra-fast local preview and offline backup
 * 2. Firestore collection 'file_storage' for real-time sharing across different users and devices
 */

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { cleanForFirestore } from './cleanFirestore';

const DB_NAME = 'k3rs_semen_gresik_db';
const STORE_NAME = 'documents_blob_store';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const idb = (event.target as IDBOpenDBRequest).result;
        if (!idb.objectStoreNames.contains(STORE_NAME)) {
          idb.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function storeInLocalIndexedDB(id: string, file: File | Blob): Promise<void> {
  try {
    const idb = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put({ id, blob: file, lastUpdated: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB save warning:', err);
  }
}

async function getFromLocalIndexedDB(id: string): Promise<Blob | null> {
  try {
    const idb = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB read warning:', err);
    return null;
  }
}

async function removeFromLocalIndexedDB(id: string): Promise<void> {
  try {
    const idb = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete warning:', err);
  }
}

async function compressImageIfPossible(file: File | Blob): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressed);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

export async function storeFileBlob(
  id: string,
  file: File | Blob,
  meta?: { name?: string; mimeType?: string }
): Promise<string | undefined> {
  // 1. Store in local IndexedDB for immediate responsive viewing on current machine
  await storeInLocalIndexedDB(id, file);

  // 2. Convert to Base64 dataUrl and store in Firestore collection 'file_storage'
  // so ANY user on ANY other computer/browser can view the uploaded file!
  let dataUrl: string | undefined = undefined;
  try {
    // Try image compression first if large image
    if (file.type.startsWith('image/') && file.size > 500 * 1024) {
      const compressed = await compressImageIfPossible(file);
      if (compressed) {
        dataUrl = compressed;
      }
    }

    if (!dataUrl) {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    // Firestore allows documents up to 1MB. We check that dataUrl fits comfortably (< 850KB)
    if (dataUrl && dataUrl.length < 850000) {
      const fileName = meta?.name || (file instanceof File ? file.name : id);
      const fileMime = meta?.mimeType || file.type || 'application/octet-stream';
      await setDoc(
        doc(db, 'file_storage', id),
        cleanForFirestore({
          docId: id,
          name: fileName,
          mimeType: fileMime,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        }),
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Firestore cloud blob sync warning:', err);
  }

  return dataUrl;
}

export async function getFileBlob(id: string): Promise<Blob | null> {
  // 1. Check local IndexedDB first
  const localBlob = await getFromLocalIndexedDB(id);
  if (localBlob) return localBlob;

  // 2. If not found locally (e.g. user is on another computer/browser), fetch from Firestore cloud!
  try {
    const snap = await getDoc(doc(db, 'file_storage', id));
    if (snap.exists()) {
      const data = snap.data();
      if (data?.dataUrl) {
        const res = await fetch(data.dataUrl);
        const remoteBlob = await res.blob();
        // Cache in local IndexedDB for future fast access
        await storeInLocalIndexedDB(id, remoteBlob);
        return remoteBlob;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `file_storage/${id}`);
  }

  return null;
}

export async function removeFileBlob(id: string): Promise<void> {
  // 1. Remove from local IndexedDB
  await removeFromLocalIndexedDB(id);

  // 2. Remove from Firestore cloud
  try {
    await deleteDoc(doc(db, 'file_storage', id));
  } catch (err) {
    console.warn('Firestore cloud blob delete warning:', err);
  }
}
