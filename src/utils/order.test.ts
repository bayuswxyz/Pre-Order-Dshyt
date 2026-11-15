import test from 'node:test';
import assert from 'node:assert/strict';
import { MENU_ITEMS } from '../data/menu';
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

test('validateOrderForm enforces cart, customer fields, QRIS proof upload, and builds exact Apps Script payload', () => {
  const emptyResult = validateOrderForm(
    {},
    {
      nama: 'Bayu Satrio',
      whatsapp: '081234567890',
      pengiriman: 'Delivery (Kampus)',
      alamat: 'Gedung Kuliah Lt. 2',
      metodePembayaran: 'COD',
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

  const missingQrisProof = validateOrderForm(cart, {
    nama: 'Bayu Satrio',
    whatsapp: '081234567890',
    pengiriman: 'Delivery (Luar Kampus)',
    alamat: 'Jl. Gerilya No. 12',
    metodePembayaran: 'QRIS',
    catatan: 'Titip satpam',
    paymentProof: null,
  });
  assert.equal(missingQrisProof.valid, false);
  assert.ok(missingQrisProof.fieldErrors.paymentProof);

  const validQris = validateOrderForm(
    cart,
    {
      nama: 'Bayu Satrio',
      whatsapp: '081234567890',
      pengiriman: 'Delivery (Luar Kampus)',
      alamat: 'Jl. Gerilya No. 12',
      metodePembayaran: 'QRIS',
      catatan: 'Titip di pos satpam',
      paymentProof: {
        fileData: 'iVBORw0KGgoAAAANSUhEUg==',
        fileName: 'bukti-qris.png',
        fileType: 'image/png',
        previewUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==',
        fileSize: 1024,
      },
    },
    'DSHYT-TEST01'
  );
  assert.equal(validQris.valid, true);
  assert.equal(validQris.payload?.metodePembayaran, 'QRIS');
  assert.equal(validQris.payload?.statusPembayaran, 'Menunggu Konfirmasi');
  assert.equal(validQris.payload?.total, 'Rp 44.000');

  const qrisBody = buildOrderRequestBody(validQris.payload!);
  assert.deepEqual(qrisBody, {
    nama: 'Bayu Satrio',
    whatsapp: '081234567890',
    pesanan: 'Coffee Milk DSHYT (2x: Less Ice, Less Sugar, Extra Shot Espresso)',
    total: 'Rp 44.000',
    pengiriman: 'Delivery (Luar Kampus)',
    alamat: 'Jl. Gerilya No. 12',
    catatan: 'Titip di pos satpam',
    metodePembayaran: 'QRIS',
    statusPembayaran: 'Menunggu Konfirmasi',
    fileData: 'iVBORw0KGgoAAAANSUhEUg==',
    fileName: 'bukti-qris.png',
    fileType: 'image/png',
  });

  const validPickupCod = validateOrderForm(cart, {
    nama: 'Bayu Satrio',
    whatsapp: '081234567890',
    pengiriman: 'Ambil di Tempat',
    alamat: '',
    metodePembayaran: 'COD',
    catatan: '',
    paymentProof: null,
  });
  assert.equal(validPickupCod.valid, true);
  const codBody = buildOrderRequestBody(validPickupCod.payload!);
  assert.equal(codBody.metodePembayaran, 'COD');
  assert.equal(codBody.statusPembayaran, 'COD');
  assert.equal(codBody.fileData, '');
  assert.equal(codBody.fileName, '');
  assert.equal(codBody.fileType, '');
  assert.equal(codBody.alamat, "Ambil langsung di booth Kopi D'SHYT");
});

test('filterMenuItems filters by category and search text', () => {
  assert.equal(MENU_ITEMS.length, 11);
  const citrus = filterMenuItems(MENU_ITEMS, 'Citrus & Sparkling', '');
  assert.equal(citrus.length, 4);

  const orangeSearch = filterMenuItems(MENU_ITEMS, 'Semua', 'orange');
  assert.equal(orangeSearch.length, 3);
  assert.ok(orangeSearch.every((item) => item.name.toLowerCase().includes('orange')));
});
