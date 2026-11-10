import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { DocumentEvidence } from '../types/k3';
import { ensureFirebaseUser } from './auth';
import { db } from './firebaseDb';

const SHARED_UPLOADS_COLLECTION = 'k3rs_shared_uploads';

export interface SharedUpload {
  itemId: string;
  document: DocumentEvidence;
  uploadedBy: string;
  uploadedAt: number;
}

interface StoredSharedUpload {
  itemId: string;
  document: DocumentEvidence;
  uploadedBy: string;
  uploadedByUid: string;
  uploadedAt?: { toMillis: () => number };
}

function stripLocalPreview(document: DocumentEvidence): DocumentEvidence {
  const { dataUrl: _dataUrl, ...sharedDocument } = document;
  return sharedDocument;
}

function isSharedUpload(value: unknown, documentId: string): value is StoredSharedUpload {
  if (!value || typeof value !== 'object') return false;
  const upload = value as Record<string, unknown>;
  const evidence = upload.document as Record<string, unknown> | undefined;
  return (
    typeof upload.itemId === 'string' &&
    typeof upload.uploadedBy === 'string' &&
    typeof upload.uploadedByUid === 'string' &&
    !!evidence &&
    evidence.id === documentId &&
    typeof evidence.name === 'string' &&
    typeof evidence.docNumber === 'string' &&
    typeof evidence.uploadDate === 'string'
  );
}

export async function publishSharedUpload(
  itemId: string,
  document: DocumentEvidence,
  uploadedBy: string
): Promise<void> {
  const user = await ensureFirebaseUser();
  await setDoc(doc(db, SHARED_UPLOADS_COLLECTION, document.id), {
    itemId,
    document: stripLocalPreview(document),
    uploadedBy: uploadedBy.trim().slice(0, 100) || 'Pengguna',
    uploadedByUid: user.uid,
    uploadedAt: serverTimestamp(),
  });
}

export async function removeSharedUpload(documentId: string): Promise<void> {
  await ensureFirebaseUser();
  await deleteDoc(doc(db, SHARED_UPLOADS_COLLECTION, documentId));
}

export function subscribeToSharedUploads(
  onUpdate: (uploads: SharedUpload[], newlyUploaded: SharedUpload[]) => void,
  onError: (error: Error) => void
): () => void {
  let disposed = false;
  let unsubscribe: (() => void) | undefined;
  let isInitialSnapshot = true;

  ensureFirebaseUser()
    .then(() => {
      if (disposed) return;
      unsubscribe = onSnapshot(
        collection(db, SHARED_UPLOADS_COLLECTION),
        (snapshot) => {
          const uploads: SharedUpload[] = [];
          const newlyUploaded: SharedUpload[] = [];
          const addedUploadIds = snapshot.metadata.fromCache
            ? new Set<string>()
            : new Set(
                snapshot
                  .docChanges()
                  .filter((change) => change.type === 'added')
                  .map((change) => change.doc.id)
              );

          snapshot.docs.forEach((uploadDoc) => {
            const data = uploadDoc.data();
            if (!isSharedUpload(data, uploadDoc.id)) return;

            const uploadedAt = data.uploadedAt?.toMillis() || 0;
            const upload: SharedUpload = {
              itemId: data.itemId,
              document: data.document,
              uploadedBy: data.uploadedBy,
              uploadedAt,
            };
            uploads.push(upload);

            if (!isInitialSnapshot && addedUploadIds.has(uploadDoc.id)) {
              newlyUploaded.push(upload);
            }
          });

          if (!snapshot.metadata.fromCache) {
            isInitialSnapshot = false;
          }
          onUpdate(uploads, newlyUploaded);
        },
        onError
      );
    })
    .catch((error: unknown) => {
      if (!disposed) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    });

  return () => {
    disposed = true;
    unsubscribe?.();
  };
}
