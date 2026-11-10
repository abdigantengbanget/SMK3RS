/**
 * Google Drive API Service
 * Handles direct uploads and management inside folder: 1Gz4nGIrBVmlM9kwcnat_L9uedqmw4KyJ
 */

export interface GDriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
  size?: string;
  parents?: string[];
}

export interface GDriveFileMetadata {
  id: string;
  name: string;
  createdTime: string;
  webViewLink?: string;
  description?: string;
  mimeType?: string;
}

export const GDRIVE_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbywYDYcPUp3zKUqwAGEP4yJ0x7UXwVKEipbV41TYh8dNP3_7K0Awit92nMZMoFb38B7Yw/exec';

/**
 * Uploads file directly to Google Drive folder using Google Apps Script Webhook.
 * Requires NO user login, NO OAuth verification, and works for all users.
 */
export async function uploadFileViaWebhook(
  fileBlob: Blob | File,
  fileName: string,
  docNumber?: string
): Promise<GDriveUploadResult> {
  const arrayBuffer = await fileBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const payload = JSON.stringify({
    fileName,
    mimeType: fileBlob.type || 'application/octet-stream',
    base64,
    docNumber,
  });

  const response = await fetch(GDRIVE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: payload,
  });

  const resText = await response.text();
  let data: any;
  try {
    data = JSON.parse(resText);
  } catch {
    console.error('GAS response error:', resText);
    throw new Error('Respon dari server Google Drive tidak valid.');
  }

  if (data.status !== 'success') {
    throw new Error(data.message || 'Gagal menyimpan ke Google Drive.');
  }

  return {
    id: data.fileId,
    name: fileName,
    webViewLink: data.url || `https://drive.google.com/file/d/${data.fileId}/view`,
  };
}

export async function listFilesInGoogleDriveFolder(
  folderId: string,
  accessToken: string
): Promise<GDriveFileMetadata[]> {
  const files: GDriveFileMetadata[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      pageSize: '1000',
      orderBy: 'createdTime desc',
      includeItemsFromAllDrives: 'true',
      supportsAllDrives: 'true',
      fields: 'nextPageToken,files(id,name,createdTime,webViewLink,description,mimeType)',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!response.ok) {
      const errorText = await response.text();
      let message = `Gagal membaca folder Google Drive (${response.status}).`;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed?.error?.message) message = parsed.error.message;
      } catch {
        // Keep the HTTP status message when Google returns a non-JSON response.
      }
      throw new Error(message);
    }

    const result = await response.json();
    files.push(...(result.files || []));
    pageToken = result.nextPageToken;
  } while (pageToken);

  return files;
}

export async function uploadFileToGoogleDriveFolder(
  fileBlob: Blob | File,
  fileName: string,
  folderId: string,
  accessToken: string,
  docNumber?: string
): Promise<GDriveUploadResult> {
  const metadata = {
    name: fileName,
    parents: [folderId],
    description: docNumber ? `Nomor Dokumen K3RS: ${docNumber}` : 'Dokumen K3RS RS Semen Gresik',
  };

  const mimeType = fileBlob.type || 'application/octet-stream';
  const boundary = `-------K3RS_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Construct standard MIME multipart/related body
  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeaderPart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const closePart = `\r\n--${boundary}--`;

  const multipartBody = new Blob([metadataPart, fileHeaderPart, fileBlob, closePart]);

  const endpoint =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink,size,parents';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Drive Upload Error Details:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
    });

    let message = `Gagal mengunggah ke Google Drive (${response.status}): ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed?.error?.message) {
        message = `Google Drive API: ${parsed.error.message}`;
      }
    } catch {
      // ignore json parse error
    }

    throw new Error(message);
  }

  const result = await response.json();
  return {
    id: result.id,
    name: result.name || fileName,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    size: result.size,
    parents: result.parents,
  };
}

export async function deleteFileFromGoogleDrive(
  fileId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const err = await response.text();
    console.error('Google Drive Delete Error:', err);
    throw new Error(`Gagal menghapus file di Google Drive: ${response.statusText}`);
  }
}
