import type { PaymentMethod, PaymentStatus } from './order';

export const MAX_PROOF_FILE_BYTES = 15 * 1024 * 1024; // 15 MB raw input before client compression
const TARGET_COMPRESS_THRESHOLD_BYTES = 220 * 1024; // Compress files larger than 220 KB
const MAX_IMAGE_DIMENSION = 1200;

const IMAGE_EXTENSION_MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  heic: 'image/heic',
  heif: 'image/heif',
};

export interface UploadedPaymentProof {
  /** Full Base64 data URI (e.g. data:image/jpeg;base64,...) compatible with Apps Script split(',')[1] */
  fileData: string;
  fileName: string;
  fileType: string;
  previewUrl: string;
  fileSize: number;
}

export function getFileExtension(fileName: string = ''): string {
  const cleaned = fileName.trim().toLowerCase();
  const dotIdx = cleaned.lastIndexOf('.');
  if (dotIdx <= 0 || dotIdx === cleaned.length - 1) return '';
  return cleaned.slice(dotIdx + 1);
}

export function isImageProofFile(file: { type?: string; name?: string }): boolean {
  const mime = (file.type || '').trim().toLowerCase();
  if (mime.startsWith('image/')) return true;
  if (!mime || mime === 'application/octet-stream') {
    const ext = getFileExtension(file.name);
    return Boolean(ext && ext in IMAGE_EXTENSION_MIME_MAP);
  }
  return false;
}

export function inferImageMimeType(file: { type?: string; name?: string }): string {
  const mime = (file.type || '').trim().toLowerCase();
  if (mime.startsWith('image/')) return mime;
  const ext = getFileExtension(file.name);
  return (ext && IMAGE_EXTENSION_MIME_MAP[ext]) || 'image/jpeg';
}

export function normalizeProofFileNameForMime(fileName: string, mimeType: string): string {
  const trimmed = (fileName || 'bukti-pembayaran').trim() || 'bukti-pembayaran';
  if (mimeType === 'image/jpeg') {
    const dotIdx = trimmed.lastIndexOf('.');
    const base = dotIdx > 0 ? trimmed.slice(0, dotIdx) : trimmed;
    return `${base}.jpg`;
  }
  return trimmed;
}

export function estimateBase64ByteLength(base64: string): number {
  const clean = base64.replace(/\s+/g, '');
  if (!clean) return 0;
  let padding = 0;
  if (clean.endsWith('==')) padding = 2;
  else if (clean.endsWith('=')) padding = 1;
  return Math.max(0, Math.floor((clean.length * 3) / 4) - padding);
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

function readRawFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Gagal membaca data gambar bukti transfer.'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Terjadi kesalahan saat membaca file bukti pembayaran.'));
    };
    reader.readAsDataURL(file);
  });
}

async function compressImageDataUrl(
  rawDataUrl: string,
  originalSize: number
): Promise<{ dataUrl: string; mimeType: string; byteSize: number } | null> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (!width || !height) {
          resolve(null);
          return;
        }

        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const needsResize = scale < 1;
        const needsCompression = originalSize > TARGET_COMPRESS_THRESHOLD_BYTES;
        if (!needsResize && !needsCompression) {
          resolve(null);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Fill white background before JPEG export in case PNG screenshot has alpha transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        let compressedUrl = canvas.toDataURL('image/jpeg', 0.8);
        let parsed = extractBase64FromDataUrl(compressedUrl);
        let compressedBytes = estimateBase64ByteLength(parsed.base64);

        if (compressedBytes > 350 * 1024) {
          const mediumUrl = canvas.toDataURL('image/jpeg', 0.58);
          const mediumParsed = extractBase64FromDataUrl(mediumUrl);
          const mediumBytes = estimateBase64ByteLength(mediumParsed.base64);
          if (mediumBytes > 0 && mediumBytes < compressedBytes) {
            compressedUrl = mediumUrl;
            parsed = mediumParsed;
            compressedBytes = mediumBytes;
          }
        }

        if (compressedBytes > 350 * 1024 && Math.max(targetWidth, targetHeight) > 900) {
          const smallScale = 900 / Math.max(targetWidth, targetHeight);
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.max(1, Math.round(targetWidth * smallScale));
          smallCanvas.height = Math.max(1, Math.round(targetHeight * smallScale));
          const smallCtx = smallCanvas.getContext('2d');
          if (smallCtx) {
            smallCtx.fillStyle = '#FFFFFF';
            smallCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
            smallCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
            const smallUrl = smallCanvas.toDataURL('image/jpeg', 0.65);
            const smallParsed = extractBase64FromDataUrl(smallUrl);
            const smallBytes = estimateBase64ByteLength(smallParsed.base64);
            if (smallBytes > 0 && smallBytes < compressedBytes) {
              compressedUrl = smallUrl;
              parsed = smallParsed;
              compressedBytes = smallBytes;
            }
          }
        }

        if (!parsed.base64 || (!needsResize && compressedBytes >= originalSize)) {
          resolve(null);
          return;
        }

        resolve({
          dataUrl: compressedUrl,
          mimeType: 'image/jpeg',
          byteSize: compressedBytes,
        });
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = rawDataUrl;
  });
}

export async function readPaymentProofAsBase64(file: File): Promise<UploadedPaymentProof> {
  if (!isImageProofFile(file)) {
    throw new Error('File harus berupa gambar (JPG, PNG, WEBP, HEIC, atau screenshot).');
  }

  if (file.size > MAX_PROOF_FILE_BYTES) {
    throw new Error('Ukuran gambar maksimal 15 MB. Silakan pilih file yang lebih kecil.');
  }

  const rawResult = await readRawFileAsDataUrl(file);
  const fallbackMime = inferImageMimeType(file);
  const { base64: rawBase64, mimeType: dataUrlMime } = extractBase64FromDataUrl(rawResult);
  if (!rawBase64) {
    throw new Error('Gagal membaca data gambar bukti transfer.');
  }

  const normalizedRawMime =
    dataUrlMime && dataUrlMime !== 'application/octet-stream' ? dataUrlMime : fallbackMime;
  const normalizedRawDataUrl =
    rawResult.startsWith('data:application/octet-stream;base64,')
      ? `data:${normalizedRawMime};base64,${rawBase64}`
      : rawResult;

  const compressed = await compressImageDataUrl(normalizedRawDataUrl, file.size);
  if (compressed) {
    return {
      fileData: compressed.dataUrl,
      fileName: normalizeProofFileNameForMime(file.name || 'bukti-pembayaran.jpg', compressed.mimeType),
      fileType: compressed.mimeType,
      previewUrl: compressed.dataUrl,
      fileSize: compressed.byteSize,
    };
  }

  return {
    fileData: normalizedRawDataUrl,
    fileName: file.name || 'bukti-pembayaran.png',
    fileType: normalizedRawMime,
    previewUrl: normalizedRawDataUrl,
    fileSize: file.size || estimateBase64ByteLength(rawBase64),
  };
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
