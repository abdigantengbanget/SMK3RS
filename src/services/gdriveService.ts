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
