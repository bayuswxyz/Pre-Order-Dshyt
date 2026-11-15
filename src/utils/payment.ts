import type { PaymentMethod, PaymentStatus } from './order';

export const MAX_PROOF_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadedPaymentProof {
  /** Full Base64 data URI (e.g. data:image/jpeg;base64,...) compatible with Apps Script split(',')[1] */
  fileData: string;
  fileName: string;
  fileType: string;
  previewUrl: string;
  fileSize: number;
}

export function generateOrderReference(
  now: number = Date.now(),
  random: number = Math.random()
): string {
  const timePart = Math.abs(Math.floor(now)).toString(36).toUpperCase().slice(-4).padStart(4, '0');
  const randPart = Math.floor(Math.max(0, Math.min(0.999999, random)) * 1296)
    .toString(36)
    .toUpperCase()
    .padStart(2, '0');
  return `DSHYT-${timePart}${randPart}`;
}

export function extractBase64FromDataUrl(dataUrl: string): {
  base64: string;
  mimeType: string;
} {
  const trimmed = dataUrl.trim();
  const match = /^data:([^;]+);base64,(.*)$/s.exec(trimmed);
  if (!match) {
    return {
      base64: trimmed,
      mimeType: 'application/octet-stream',
    };
  }
  return {
    mimeType: match[1] || 'application/octet-stream',
    base64: match[2] || '',
  };
}

export function readPaymentProofAsBase64(file: File): Promise<UploadedPaymentProof> {
  return new Promise((resolve, reject) => {
    if (!file.type || !file.type.startsWith('image/')) {
      reject(new Error('File harus berupa gambar (JPG, PNG, WEBP, atau screenshot).'));
      return;
    }

    if (file.size > MAX_PROOF_FILE_BYTES) {
      reject(new Error('Ukuran gambar maksimal 5 MB. Silakan pilih file yang lebih kecil.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const { base64, mimeType } = extractBase64FromDataUrl(result);
      if (!base64) {
        reject(new Error('Gagal membaca data gambar bukti transfer.'));
        return;
      }

      resolve({
        fileData: result,
        fileName: file.name || 'bukti-pembayaran.png',
        fileType: file.type || mimeType,
        previewUrl: result,
        fileSize: file.size,
      });
    };

    reader.onerror = () => {
      reject(new Error('Terjadi kesalahan saat membaca file bukti pembayaran.'));
    };

    reader.readAsDataURL(file);
  });
}

export function getPaymentStatusForMethod(method: PaymentMethod): PaymentStatus {
  return method === 'QR' ? 'Menunggu Konfirmasi' : 'Pending';
}

export function formatPaymentMethodLabel(method: PaymentMethod): string {
  return method === 'QR' ? 'QR / QRIS' : 'Cash / COD';
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
