import test from 'node:test';
import assert from 'node:assert/strict';
import { MENU_ITEMS } from '../data/menu';
import {
  PAYMENT_PROOF_DRIVE_FOLDER_ID,
  PAYMENT_PROOF_DRIVE_FOLDER_NAME,
} from './googleDrive';
import {
  addCustomizedCartItem,
  buildOrderRequestBody,
  calculateCartTotals,
  decrementMenuItemLatestVariant,
  EXTRA_SHOT_PRICE,
  filterMenuItems,
  formatCustomizationSummary,
  formatRupiah,
  getDeliveryFieldConfig,
  getMenuQuantityInCart,
  parseOrderScriptResponse,
  updateCartVariantQuantity,
  validateOrderForm,
  type CartState,
} from './order';

test('formatRupiah formats Indonesian currency accurately', () => {
  assert.equal(formatRupiah(0), 'Rp 0');
  assert.equal(formatRupiah(10000), 'Rp 10.000');
  assert.equal(formatRupiah(16000), 'Rp 16.000');
  assert.equal(formatRupiah(125000), 'Rp 125.000');
});

test('addCustomizedCartItem separates variants and adds extra shot price accurately', () => {
  const espresso = MENU_ITEMS[0]; // 10.000
  const coffeeMilk = MENU_ITEMS[10]; // 13.000

  let cart: CartState = {};
  cart = addCustomizedCartItem(cart, espresso, {
    ice: 'Normal Ice',
    sugar: 'Normal Sugar',
    extraShot: false,
    note: '',
  });
  cart = addCustomizedCartItem(cart, espresso, {
    ice: 'Less Ice',
    sugar: 'Less Sugar',
    extraShot: true,
    note: 'Es dipisah',
  });
  cart = addCustomizedCartItem(
    cart,
    coffeeMilk,
    {
      ice: 'No Ice',
      sugar: 'No Sugar',
      extraShot: false,
      note: '',
    },
    2
  );

  assert.equal(getMenuQuantityInCart(cart, espresso.id), 2);
  assert.equal(getMenuQuantityInCart(cart, coffeeMilk.id), 2);

  const totals = calculateCartTotals(cart);
  assert.equal(totals.totalItems, 4);
  // 10.000 + (10.000 + 9.000) + (13.000 * 2) = 55.000
  assert.equal(totals.totalPrice, 10000 + (10000 + EXTRA_SHOT_PRICE) + 26000);
  assert.equal(totals.formattedTotal, 'Rp 55.000');
  assert.match(totals.payloadPesanan, /Less Ice, Less Sugar, Extra Shot Espresso, Catatan: Es dipisah/);

  // Decrement latest espresso variant removes the second variant cleanly
  cart = decrementMenuItemLatestVariant(cart, espresso.id);
  assert.equal(getMenuQuantityInCart(cart, espresso.id), 1);

  const remainingKey = Object.keys(cart).find((k) => cart[k].menuId === coffeeMilk.id)!;
  cart = updateCartVariantQuantity(cart, remainingKey, -2);
  assert.equal(getMenuQuantityInCart(cart, coffeeMilk.id), 0);
});

test('formatCustomizationSummary formats ice, sugar, extra shot, and note cleanly', () => {
  assert.equal(
    formatCustomizationSummary({
      ice: 'Normal Ice',
      sugar: 'Normal Sugar',
      extraShot: false,
      note: '',
    }),
    'Normal Ice, Normal Sugar'
  );
  assert.equal(
    formatCustomizationSummary({
      ice: 'Less Ice',
      sugar: 'No Sugar',
      extraShot: true,
      note: 'Tanpa sedotan',
    }),
    'Less Ice, No Sugar, Extra Shot Espresso, Catatan: Tanpa sedotan'
  );
});

test('getDeliveryFieldConfig toggles label, placeholder, and required flag cleanly', () => {
  const campus = getDeliveryFieldConfig('Delivery (Kampus)');
  assert.equal(campus.label, 'Detail Lokasi / Gedung Kampus');
  assert.equal(campus.required, true);

  const offCampus = getDeliveryFieldConfig('Delivery (Luar Kampus)');
  assert.equal(offCampus.label, 'Alamat Lengkap Kos / Rumah');
  assert.equal(offCampus.required, true);

  const pickup = getDeliveryFieldConfig('Ambil di Tempat');
  assert.equal(pickup.required, false);
});

test('validateOrderForm enforces cart, customer fields, QR proof upload, and builds conditional Cash/QR payloads', () => {
  const emptyResult = validateOrderForm(
    {},
    {
      nama: 'Bayu Satrio',
      whatsapp: '081234567890',
      pengiriman: 'Delivery (Kampus)',
      alamat: 'Gedung Kuliah Lt. 2',
      metodePembayaran: 'Cash',
      catatan: '',
      paymentProof: null,
    }
  );
  assert.equal(emptyResult.valid, false);
  assert.equal(emptyResult.fieldErrors.cart, 'Silakan pilih minimal 1 menu kopi terlebih dahulu!');

  const cart = addCustomizedCartItem(
    {},
    MENU_ITEMS[10],
    {
      ice: 'Less Ice',
      sugar: 'Less Sugar',
      extraShot: true,
      note: '',
    },
    2
  ); // (13.000 + 9.000) * 2 = 44.000

  const missingQrProof = validateOrderForm(cart, {
    nama: 'Bayu Satrio',
    whatsapp: '081234567890',
    pengiriman: 'Delivery (Luar Kampus)',
    alamat: 'Jl. Gerilya No. 12',
    metodePembayaran: 'QR',
    catatan: 'Titip satpam',
    paymentProof: null,
  });
  assert.equal(missingQrProof.valid, false);
  assert.ok(missingQrProof.fieldErrors.paymentProof);

  const validQr = validateOrderForm(
    cart,
    {
      nama: 'Bayu Satrio',
      whatsapp: '081234567890',
      pengiriman: 'Delivery (Luar Kampus)',
      alamat: 'Jl. Gerilya No. 12',
      metodePembayaran: 'QR',
      catatan: 'Titip di pos satpam',
      paymentProof: {
        fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        fileName: 'bukti-qr.png',
        fileType: 'image/png',
        previewUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        fileSize: 1024,
      },
    },
    'DSHYT-TEST01'
  );
  assert.equal(validQr.valid, true);
  assert.equal(validQr.payload?.metodePembayaran, 'QR');
  assert.equal(validQr.payload?.statusPembayaran, 'Menunggu Konfirmasi');
  assert.equal(validQr.payload?.total, 'Rp 44.000');

  const qrBody = buildOrderRequestBody(validQr.payload!, '2026-11-15T11:20:00.000Z');
  assert.deepEqual(qrBody, {
    timestamp: '2026-11-15T11:20:00.000Z',
    kodeReferensi: 'DSHYT-TEST01',
    nama: 'Bayu Satrio',
    whatsapp: '081234567890',
    pesanan: 'Coffee Milk DSHYT (2x: Less Ice, Less Sugar, Extra Shot Espresso)',
    total: 'Rp 44.000',
    pengiriman: 'Delivery (Luar Kampus)',
    alamat: 'Jl. Gerilya No. 12',
    catatan: 'Titip di pos satpam',
    metodePembayaran: 'QR',
    statusPembayaran: 'Menunggu Konfirmasi',
    buktiPembayaran: '',
    driveFolderId: PAYMENT_PROOF_DRIVE_FOLDER_ID,
    driveFolderName: PAYMENT_PROOF_DRIVE_FOLDER_NAME,
    fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
    fileName: 'bukti-qr.png',
    fileType: 'image/png',
  });

  // Even if paymentProof was attached before switching back to Cash, Cash payload clears fileData and sets buktiPembayaran = '-'
  const validPickupCash = validateOrderForm(cart, {
    nama: 'Bayu Satrio',
    whatsapp: '081234567890',
    pengiriman: 'Ambil di Tempat',
    alamat: '',
    metodePembayaran: 'Cash',
    catatan: '',
    paymentProof: {
      fileData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
      fileName: 'stale-proof.png',
      fileType: 'image/png',
      previewUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
      fileSize: 1024,
    },
  });
  assert.equal(validPickupCash.valid, true);
  const cashBody = buildOrderRequestBody(validPickupCash.payload!, '2026-11-15T11:20:00.000Z');
  assert.equal(cashBody.metodePembayaran, 'Cash');
  assert.equal(cashBody.statusPembayaran, 'Pending');
  assert.equal(cashBody.buktiPembayaran, '-');
  assert.equal(cashBody.fileData, '');
  assert.equal(cashBody.fileName, '');
  assert.equal(cashBody.fileType, '');
  assert.equal(cashBody.alamat, "Ambil langsung di booth Kopi D'SHYT");
});

test('parseOrderScriptResponse detects JSON error and Drive URL responses cleanly', () => {
  assert.deepEqual(parseOrderScriptResponse(''), { ok: true });
  assert.deepEqual(parseOrderScriptResponse('{"status":"success","row":2}'), {
    ok: true,
    buktiPembayaran: undefined,
  });
  assert.deepEqual(
    parseOrderScriptResponse(
      '{"status":"success","row":2,"buktiPembayaran":"https://drive.google.com/file/d/abc/view"}'
    ),
    {
      ok: true,
      buktiPembayaran: 'https://drive.google.com/file/d/abc/view',
    }
  );
  assert.deepEqual(
    parseOrderScriptResponse('{"status":"error","message":"Sheet tidak ditemukan"}'),
    { ok: false, message: 'Sheet tidak ditemukan' }
  );
});

test('filterMenuItems filters by category and search text', () => {
  assert.equal(MENU_ITEMS.length, 11);
  const citrus = filterMenuItems(MENU_ITEMS, 'Citrus & Sparkling', '');
  assert.equal(citrus.length, 4);

  const orangeSearch = filterMenuItems(MENU_ITEMS, 'Semua', 'orange');
  assert.equal(orangeSearch.length, 3);
  assert.ok(orangeSearch.every((item) => item.name.toLowerCase().includes('orange')));
});
