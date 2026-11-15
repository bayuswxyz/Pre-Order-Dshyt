import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  AlertCircle,
  ExternalLink,
  FileImage,
  FolderOpen,
  Loader2,
  LogOut,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  clearCachedAccessToken,
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from '../utils/firebaseAuth';
import {
  deleteDriveFile,
  type DriveFileRecord,
  type DriveScopeFilter,
  DriveUnauthorizedError,
  listDriveFiles,
  PAYMENT_PROOF_DRIVE_FOLDER_ID,
  PAYMENT_PROOF_DRIVE_FOLDER_URL,
  renameDriveFile,
  uploadFileToDrive,
} from '../utils/googleDrive';
import { formatFileSize } from '../utils/payment';
import { GoogleSignInButton } from './GoogleSignInButton';

interface DriveProofsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PendingMutation =
  | { type: 'delete'; file: DriveFileRecord }
  | { type: 'rename'; file: DriveFileRecord; nextName: string };

function formatDriveDate(iso?: string): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DriveProofsModal({ isOpen, onClose }: DriveProofsModalProps) {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [scopeFilter, setScopeFilter] = useState<DriveScopeFilter>('folder');
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<DriveFileRecord[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [pendingMutation, setPendingMutation] = useState<PendingMutation | null>(null);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (signedInUser) => {
        setUser(signedInUser);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (pendingMutation) {
          setPendingMutation(null);
        } else {
          onClose();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, pendingMutation]);

  const loadFiles = useCallback(
    async (overrideToken?: string) => {
      const token = overrideToken ?? (await getAccessToken());
      if (!token) {
        setNeedsAuth(true);
        return;
      }

      setErrorMsg(null);
      setIsLoadingFiles(true);
      try {
        const result = await listDriveFiles(token, {
          scope: scopeFilter,
          searchQuery,
          folderId: PAYMENT_PROOF_DRIVE_FOLDER_ID,
        });
        setFiles(result);
      } catch (error) {
        if (error instanceof DriveUnauthorizedError) {
          clearCachedAccessToken();
          setNeedsAuth(true);
        }
        setErrorMsg(
          error instanceof Error ? error.message : 'Gagal memuat daftar file Google Drive.'
        );
      } finally {
        setIsLoadingFiles(false);
      }
    },
    [scopeFilter, searchQuery]
  );

  useEffect(() => {
    if (isOpen && !needsAuth) {
      void loadFiles();
    }
  }, [isOpen, needsAuth, loadFiles]);

  async function handleLogin() {
    setErrorMsg(null);
    setStatusMsg(null);
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      setUser(result.user);
      setNeedsAuth(false);
      await loadFiles(result.accessToken);
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Login Google dibatalkan atau gagal. Silakan coba lagi.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    setErrorMsg(null);
    setStatusMsg(null);
    setPendingMutation(null);
    await logout();
    setUser(null);
    setNeedsAuth(true);
    setFiles([]);
  }

  async function handleUploadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setErrorMsg(null);
    setStatusMsg(null);
    setIsUploading(true);
    try {
      const created = await uploadFileToDrive(token, file, PAYMENT_PROOF_DRIVE_FOLDER_ID);
      setStatusMsg(`File "${created.name}" berhasil diunggah ke folder Google Drive.`);
      await loadFiles(token);
    } catch (error) {
      if (error instanceof DriveUnauthorizedError) {
        clearCachedAccessToken();
        setNeedsAuth(true);
      }
      setErrorMsg(
        error instanceof Error ? error.message : 'Gagal mengunggah file ke Google Drive.'
      );
    } finally {
      setIsUploading(false);
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    }
  }

  async function handleConfirmMutation() {
    if (!pendingMutation) return;

    const token = await getAccessToken();
    if (!token) {
      setPendingMutation(null);
      setNeedsAuth(true);
      return;
    }

    setErrorMsg(null);
    setStatusMsg(null);
    setIsMutating(true);
    try {
      if (pendingMutation.type === 'delete') {
        await deleteDriveFile(token, pendingMutation.file.id);
        setStatusMsg(`File "${pendingMutation.file.name}" telah dihapus dari Google Drive.`);
      } else {
        const updated = await renameDriveFile(
          token,
          pendingMutation.file.id,
          pendingMutation.nextName
        );
        setStatusMsg(`Nama file diperbarui menjadi "${updated.name}".`);
      }
      setPendingMutation(null);
      await loadFiles(token);
    } catch (error) {
      if (error instanceof DriveUnauthorizedError) {
        clearCachedAccessToken();
        setNeedsAuth(true);
      }
      setErrorMsg(
        error instanceof Error ? error.message : 'Gagal memperbarui file di Google Drive.'
      );
    } finally {
      setIsMutating(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1614]/65 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drive-modal-title"
        data-testid="drive-panel-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-[#E7E2DA] bg-[#FAF8F5] shadow-[0_24px_60px_-16px_rgba(26,22,20,0.45)]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E7E2DA] bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#9A3412]">
              <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Google Drive · Arsip Bukti Pembayaran</span>
            </div>
            <h2
              id="drive-modal-title"
              className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[#1A1614]"
            >
              Kelola File Bukti Transfer
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel Google Drive"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E7E2DA] bg-[#FAF8F5] text-[#5E544E] transition-colors hover:bg-[#EFEAE2] hover:text-[#1A1614] cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-sm text-[#991B1B]"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusMsg && (
            <div className="rounded-lg border border-[#D8E2D8] bg-[#F5F9F5] p-3 text-xs font-medium text-[#1E4620]">
              {statusMsg}
            </div>
          )}

          {needsAuth ? (
            <div
              data-testid="drive-auth-gate"
              className="rounded-xl border border-[#E7E2DA] bg-white p-6 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF5EB] border border-[#F39C12]/30 text-[#C2410C]">
                <FolderOpen className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold text-[#1A1614]">
                Hubungkan Google Drive Anda
              </h3>
              <p className="mx-auto mt-1.5 max-w-[46ch] text-sm leading-relaxed text-[#5E544E]">
                Masuk dengan akun Google Anda untuk melihat daftar bukti transfer di folder Kopi
                D&apos;SHYT, mengunggah gambar bukti baru, mengganti nama, atau menghapus file dengan
                izin Anda.
              </p>
              <div className="mt-5 flex justify-center">
                <GoogleSignInButton onClick={handleLogin} isLoading={isLoggingIn} />
              </div>
              <div className="mt-4 pt-4 border-t border-[#EFEAE2]">
                <a
                  href={PAYMENT_PROOF_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A3412] hover:underline"
                >
                  <span>Buka Folder Bukti Bayar di Tab Baru</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Account Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7E2DA] bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs text-[#786D65]">Terhubung ke Google Drive sebagai</p>
                  <p className="text-sm font-semibold text-[#1A1614] truncate">
                    {user?.displayName || user?.email || 'Akun Google'}
                    {user?.email && user?.displayName ? ` (${user.email})` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={PAYMENT_PROOF_DRIVE_FOLDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDD6CC] bg-[#FAF8F5] px-3 text-xs font-semibold text-[#1A1614] hover:bg-[#EFEAE2]"
                  >
                    <span>Buka Folder</span>
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDD6CC] bg-white px-3 text-xs font-semibold text-[#5E544E] hover:bg-[#FEF2F2] hover:text-[#B91C1C] cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1.5" role="tablist" aria-label="Cakupan Drive">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={scopeFilter === 'folder'}
                    onClick={() => setScopeFilter('folder')}
                    className={`h-9 rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer ${
                      scopeFilter === 'folder'
                        ? 'bg-[#1A1614] text-white'
                        : 'bg-[#EFEAE2] text-[#5E544E] hover:text-[#1A1614]'
                    }`}
                  >
                    Folder Bukti Bayar
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={scopeFilter === 'all'}
                    onClick={() => setScopeFilter('all')}
                    className={`h-9 rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer ${
                      scopeFilter === 'all'
                        ? 'bg-[#1A1614] text-white'
                        : 'bg-[#EFEAE2] text-[#5E544E] hover:text-[#1A1614]'
                    }`}
                  >
                    Semua File Drive
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadFile}
                    aria-label="Unggah file bukti pembayaran ke Google Drive"
                    className="sr-only"
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => uploadInputRef.current?.click()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C2410C] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#9A3412] disabled:opacity-60 cursor-pointer"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{isUploading ? 'Mengunggah...' : 'Unggah Bukti'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoadingFiles}
                    onClick={() => void loadFiles()}
                    aria-label="Muat ulang daftar file Google Drive"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDD6CC] bg-white text-[#1A1614] hover:bg-[#EFEAE2] cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#786D65]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama file bukti pembayaran..."
                  aria-label="Cari file di Google Drive"
                  className="h-10 w-full rounded-lg border border-[#DDD6CC] bg-white pl-9 pr-3.5 text-sm text-[#1A1614] placeholder:text-[#9C9189] focus:border-[#C2410C] focus:outline-none"
                />
              </div>

              {/* Explicit Confirmation Dialog for Mutating / Destructive Operations */}
              {pendingMutation && (
                <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="drive-confirm-title"
                  data-testid="drive-mutation-confirm"
                  className="rounded-xl border border-[#C2410C]/40 bg-[#FFF8F3] p-4 shadow-sm"
                >
                  <h3
                    id="drive-confirm-title"
                    className="text-sm font-bold text-[#1A1614]"
                  >
                    {pendingMutation.type === 'delete'
                      ? `Hapus file "${pendingMutation.file.name}" dari Google Drive?`
                      : `Ubah nama file "${pendingMutation.file.name}"?`}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#5E544E]">
                    {pendingMutation.type === 'delete'
                      ? 'File ini akan dihapus secara permanen dari Google Drive Anda. Pastikan bukti pembayaran ini memang sudah tidak diperlukan.'
                      : 'Masukkan nama file baru di bawah lalu klik konfirmasi untuk menyimpan perubahan di Google Drive.'}
                  </p>

                  {pendingMutation.type === 'rename' && (
                    <div className="mt-3">
                      <label htmlFor="drive-rename-input" className="sr-only">
                        Nama file baru
                      </label>
                      <input
                        id="drive-rename-input"
                        type="text"
                        value={pendingMutation.nextName}
                        onChange={(e) =>
                          setPendingMutation({
                            ...pendingMutation,
                            nextName: e.target.value,
                          })
                        }
                        className="h-9 w-full rounded-lg border border-[#DDD6CC] bg-white px-3 text-sm text-[#1A1614] focus:border-[#C2410C] focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={() => setPendingMutation(null)}
                      className="inline-flex h-9 items-center rounded-lg border border-[#DDD6CC] bg-white px-3.5 text-xs font-semibold text-[#1A1614] hover:bg-[#EFEAE2] cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={
                        isMutating ||
                        (pendingMutation.type === 'rename' &&
                          !pendingMutation.nextName.trim())
                      }
                      onClick={() => void handleConfirmMutation()}
                      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-semibold text-white cursor-pointer disabled:opacity-60 ${
                        pendingMutation.type === 'delete'
                          ? 'bg-[#B91C1C] hover:bg-[#991B1B]'
                          : 'bg-[#C2410C] hover:bg-[#9A3412]'
                      }`}
                    >
                      {isMutating && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      )}
                      <span>
                        {pendingMutation.type === 'delete'
                          ? 'Konfirmasi Hapus'
                          : 'Konfirmasi Ubah Nama'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* File List */}
              {isLoadingFiles ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E7E2DA] bg-white py-10 text-sm text-[#5E544E]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#C2410C]" aria-hidden="true" />
                  <span>Memuat file dari Google Drive...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="rounded-xl border border-[#E7E2DA] bg-white p-8 text-center">
                  <p className="text-sm font-semibold text-[#1A1614]">
                    Belum ada file ditemukan
                  </p>
                  <p className="mt-1 text-xs text-[#786D65]">
                    {scopeFilter === 'folder'
                      ? 'Folder bukti pembayaran masih kosong atau belum ada file yang cocok dengan pencarian.'
                      : 'Tidak ada file Google Drive yang cocok dengan pencarian Anda.'}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {files.map((file) => (
                    <li
                      key={file.id}
                      className="flex flex-col gap-3 rounded-xl border border-[#E7E2DA] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#EFEAE2] bg-[#FAF8F5] text-[#C2410C] overflow-hidden">
                          {file.thumbnailLink ? (
                            <img
                              src={file.thumbnailLink}
                              alt={file.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileImage className="h-5 w-5" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1A1614] truncate">
                            {file.name}
                          </p>
                          <p className="mt-0.5 text-xs text-[#786D65]">
                            {formatDriveDate(file.modifiedTime)}
                            {file.size ? ` · ${formatFileSize(Number(file.size))}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Buka ${file.name} di Google Drive`}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E7E2DA] bg-[#FAF8F5] px-2.5 text-xs font-medium text-[#1A1614] hover:bg-[#EFEAE2]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Buka</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setPendingMutation({
                              type: 'rename',
                              file,
                              nextName: file.name,
                            })
                          }
                          aria-label={`Ubah nama ${file.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E7E2DA] bg-[#FAF8F5] text-[#5E544E] hover:bg-[#EFEAE2] hover:text-[#1A1614] cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingMutation({ type: 'delete', file })}
                          aria-label={`Hapus ${file.name}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E7E2DA] bg-[#FAF8F5] text-[#5E544E] hover:bg-[#FEF2F2] hover:text-[#B91C1C] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
