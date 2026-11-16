import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateBase64ByteLength,
  extractBase64FromDataUrl,
  formatFileSize,
  formatPaymentMethodLabel,
  generateOrderReference,
  getPaymentStatusForMethod,
  inferImageMimeType,
  isImageProofFile,
  normalizeProofFileNameForMime,
} from './payment';

test('generateOrderReference creates stable DSHYT reference codes', () => {
  const ref = generateOrderReference(1700000000000, 0.5);
  assert.match(ref, /^DSHYT-[A-Z0-9]{6}$/);

  const refMin = generateOrderReference(0, 0);
  assert.equal(refMin, 'DSHYT-000000');
});

test('extractBase64FromDataUrl strips data URI header for Google Apps Script', () => {
  const parsed = extractBase64FromDataUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg==');
  assert.equal(parsed.mimeType, 'image/jpeg');
  assert.equal(parsed.base64, '/9j/4AAQSkZJRg==');

  const raw = extractBase64FromDataUrl('YWJjMTIz');
  assert.equal(raw.base64, 'YWJjMTIz');
});

test('isImageProofFile and inferImageMimeType handle mobile files with empty MIME type', () => {
  assert.equal(isImageProofFile({ type: 'image/png', name: 'qris.png' }), true);
  assert.equal(isImageProofFile({ type: '', name: 'Screenshot_20261116.jpg' }), true);
  assert.equal(isImageProofFile({ type: 'application/octet-stream', name: 'IMG_1024.HEIC' }), true);
  assert.equal(isImageProofFile({ type: 'application/pdf', name: 'nota.pdf' }), false);
  assert.equal(isImageProofFile({ type: '', name: 'dokumen.pdf' }), false);

  assert.equal(inferImageMimeType({ type: '', name: 'foto.PNG' }), 'image/png');
  assert.equal(inferImageMimeType({ type: '', name: 'foto.webp' }), 'image/webp');
  assert.equal(inferImageMimeType({ type: 'image/jpeg', name: 'foto' }), 'image/jpeg');
});

test('normalizeProofFileNameForMime and estimateBase64ByteLength work accurately', () => {
  assert.equal(normalizeProofFileNameForMime('screenshot.png', 'image/jpeg'), 'screenshot.jpg');
  assert.equal(normalizeProofFileNameForMime('bukti.png', 'image/png'), 'bukti.png');
  assert.equal(estimateBase64ByteLength('YWJj'), 3); // "abc"
  assert.equal(estimateBase64ByteLength('YWI='), 2); // "ab"
});

test('getPaymentStatusForMethod and formatPaymentMethodLabel map QR and Cash', () => {
  assert.equal(getPaymentStatusForMethod('QR'), 'Menunggu Konfirmasi');
  assert.equal(getPaymentStatusForMethod('Cash'), 'Pending');
  assert.equal(formatPaymentMethodLabel('QR'), 'QR / QRIS');
  assert.equal(formatPaymentMethodLabel('Cash'), 'Cash / COD');
});

test('formatFileSize formats KB and MB cleanly', () => {
  assert.equal(formatFileSize(500), '1 KB');
  assert.equal(formatFileSize(51200), '50 KB');
  assert.equal(formatFileSize(2 * 1024 * 1024), '2.0 MB');
});
