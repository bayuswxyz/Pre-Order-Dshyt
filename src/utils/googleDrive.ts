export const PAYMENT_PROOF_DRIVE_FOLDER_ID = '1AaC0W21EWIVzxZAdu0lNLPumyN3eDJJH';
export const PAYMENT_PROOF_DRIVE_FOLDER_NAME = 'bukti pembayaran';
export const PAYMENT_PROOF_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${PAYMENT_PROOF_DRIVE_FOLDER_ID}`;

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
] as const;

export type DriveScopeFilter = 'folder' | 'all';

export interface DriveFileRecord {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
}

export class DriveUnauthorizedError extends Error {
  constructor(message: string = 'Sesi Google Drive berakhir. Silakan masuk kembali.') {
    super(message);
    this.name = 'DriveUnauthorizedError';
  }
}

export function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function buildDriveListQuery(
  scope: DriveScopeFilter,
  searchQuery: string = '',
  folderId: string = PAYMENT_PROOF_DRIVE_FOLDER_ID
): string {
  const clauses: string[] = ['trashed = false'];
  if (scope === 'folder' && folderId.trim()) {
    clauses.push(`'${escapeDriveQueryValue(folderId.trim())}' in parents`);
  }
  const trimmedSearch = searchQuery.trim();
  if (trimmedSearch) {
    clauses.push(`name contains '${escapeDriveQueryValue(trimmedSearch)}'`);
  }
  return clauses.join(' and ');
}

export function buildDriveListUrl(options: {
  scope: DriveScopeFilter;
  searchQuery?: string;
  folderId?: string;
  pageSize?: number;
}): string {
  const q = buildDriveListQuery(options.scope, options.searchQuery, options.folderId);
  const params = new URLSearchParams({
    q,
    pageSize: String(options.pageSize ?? 25),
    orderBy: 'modifiedTime desc',
    fields:
      'files(id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,iconLink)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  return `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
}

export function buildDriveMultipartBody(options: {
  fileName: string;
  mimeType: string;
  contentBytes: Uint8Array;
  folderId?: string;
  boundary?: string;
}): { body: Blob; contentType: string } {
  const boundary = options.boundary || `kopi_dshyt_${Date.now().toString(36)}`;
  const metadata: { name: string; parents?: string[] } = {
    name: options.fileName,
  };
  if (options.folderId?.trim()) {
    metadata.parents = [options.folderId.trim()];
  }

  const preamble =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${options.mimeType || 'application/octet-stream'}\r\n\r\n`;
  const closing = `\r\n--${boundary}--`;

  const fileCopy = new Uint8Array(options.contentBytes);
  const body = new Blob([preamble, fileCopy, closing], {
    type: `multipart/related; boundary=${boundary}`,
  });

  return {
    body,
    contentType: `multipart/related; boundary=${boundary}`,
  };
}

async function parseDriveErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } };
    if (data?.error?.message) {
      return data.error.message;
    }
  } catch {
    // Ignore non-JSON error body
  }
  return `Permintaan Google Drive gagal (HTTP ${response.status}).`;
}

export async function listDriveFiles(
  accessToken: string,
  options: {
    scope: DriveScopeFilter;
    searchQuery?: string;
    folderId?: string;
  },
  fetchFn: typeof fetch = fetch
): Promise<DriveFileRecord[]> {
  const url = buildDriveListUrl(options);
  const response = await fetchFn(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new DriveUnauthorizedError();
  }
  if (!response.ok) {
    throw new Error(await parseDriveErrorMessage(response));
  }

  const data = (await response.json()) as { files?: DriveFileRecord[] };
  return Array.isArray(data.files) ? data.files : [];
}

export async function uploadFileToDrive(
  accessToken: string,
  file: File,
  folderId: string = PAYMENT_PROOF_DRIVE_FOLDER_ID,
  fetchFn: typeof fetch = fetch
): Promise<DriveFileRecord> {
  const buffer = await file.arrayBuffer();
  const { body, contentType } = buildDriveMultipartBody({
    fileName: file.name || `bukti-bayar-${Date.now()}.png`,
    mimeType: file.type || 'application/octet-stream',
    contentBytes: new Uint8Array(buffer),
    folderId,
  });

  const url =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,iconLink';

  const response = await fetchFn(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': contentType,
    },
    body,
  });

  if (response.status === 401) {
    throw new DriveUnauthorizedError();
  }
  if (!response.ok) {
    throw new Error(await parseDriveErrorMessage(response));
  }

  return (await response.json()) as DriveFileRecord;
}

export async function renameDriveFile(
  accessToken: string,
  fileId: string,
  newName: string,
  fetchFn: typeof fetch = fetch
): Promise<DriveFileRecord> {
  const trimmedName = newName.trim();
  if (!trimmedName) {
    throw new Error('Nama file baru tidak boleh kosong.');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
    fileId
  )}?supportsAllDrives=true&fields=id,name,mimeType,size,modifiedTime,webViewLink,thumbnailLink,iconLink`;

  const response = await fetchFn(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: trimmedName }),
  });

  if (response.status === 401) {
    throw new DriveUnauthorizedError();
  }
  if (!response.ok) {
    throw new Error(await parseDriveErrorMessage(response));
  }

  return (await response.json()) as DriveFileRecord;
}

export async function deleteDriveFile(
  accessToken: string,
  fileId: string,
  fetchFn: typeof fetch = fetch
): Promise<void> {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
    fileId
  )}?supportsAllDrives=true`;

  const response = await fetchFn(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401) {
    throw new DriveUnauthorizedError();
  }
  if (!response.ok && response.status !== 204) {
    throw new Error(await parseDriveErrorMessage(response));
  }
}
