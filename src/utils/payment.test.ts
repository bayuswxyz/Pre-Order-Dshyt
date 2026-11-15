import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractBase64FromDataUrl,
  formatFileSize,
  formatPaymentMethodLabel,
  generateOrderReference,
  getPaymentStatusForMethod,
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
