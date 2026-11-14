import test from 'node:test';
import assert from 'node:assert/strict';
import { MENU_ITEMS } from '../data/menu';
import {
  calculateCartTotals,
  filterMenuItems,
  formatRupiah,
  getDeliveryFieldConfig,
  updateCartQuantity,
  validateOrderForm,
  type CartState,
} from './order';

test('formatRupiah formats Indonesian currency accurately', () => {
  assert.equal(formatRupiah(0), 'Rp 0');
  assert.equal(formatRupiah(10000), 'Rp 10.000');
  assert.equal(formatRupiah(16000), 'Rp 16.000');
  assert.equal(formatRupiah(125000), 'Rp 125.000');
});

test('updateCartQuantity increments, decrements, and removes zero-quantity items', () => {
  const espresso = MENU_ITEMS[0];
  const orangeCoffee = MENU_ITEMS[3];

  let cart: CartState = {};
  cart = updateCartQuantity(cart, espresso, 1);
  cart = updateCartQuantity(cart, espresso, 1);
  cart = updateCartQuantity(cart, orangeCoffee, 1);

  assert.equal(cart[espresso.cartKey].qty, 2);
  assert.equal(cart[orangeCoffee.cartKey].qty, 1);

  cart = updateCartQuantity(cart, orangeCoffee, -1);
  assert.equal(cart[orangeCoffee.cartKey], undefined);

  cart = updateCartQuantity(cart, espresso, -5);
  assert.deepEqual(cart, {});
});

test('calculateCartTotals computes totals and exact Google Sheets payload format', () => {
  const espresso = MENU_ITEMS[0]; // 10.000
  const antiBlanc = MENU_ITEMS[4]; // Anti Blanc Dshyt, 18.000

  let cart: CartState = {};
  assert.equal(calculateCartTotals(cart).summaryText, 'Belum ada menu yang dipilih.');
  assert.equal(calculateCartTotals(cart).formattedTotal, 'Rp 0');

  cart = updateCartQuantity(cart, espresso, 2);
  cart = updateCartQuantity(cart, antiBlanc, 1);

  const totals = calculateCartTotals(cart);
  assert.equal(totals.totalItems, 3);
  assert.equal(totals.totalPrice, 38000);
  assert.equal(totals.formattedTotal, 'Rp 38.000');
  assert.equal(totals.summaryText, 'Espresso Pouch (2x), Anti Blanc Dshyt (1x)');
  assert.equal(totals.payloadPesanan, 'Espresso Pouch (2), Anti Blanc Dshyt (1)');
});

test('getDeliveryFieldConfig toggles label and placeholder cleanly', () => {
  const campus = getDeliveryFieldConfig('Kampus');
  assert.equal(campus.label, 'Detail Lokasi / Gedung Kampus');
  assert.match(campus.placeholder, /Fakultas Teknik/);

  const offCampus = getDeliveryFieldConfig('Luar Kampus');
  assert.equal(offCampus.label, 'Alamat Lengkap Kos / Rumah');
  assert.match(offCampus.placeholder, /Gerilya/);
});

test('validateOrderForm enforces cart presence and required customer fields', () => {
  const emptyResult = validateOrderForm(
    {},
    {
      nama: 'Bayu Satrio',
      whatsapp: '081234567890',
      pengiriman: 'Kampus',
      alamat: 'Gedung Kuliah Lt. 2',
      catatan: '',
    }
  );
  assert.equal(emptyResult.valid, false);
  assert.equal(emptyResult.fieldErrors.cart, 'Silakan pilih minimal 1 menu kopi terlebih dahulu!');

  const cart = updateCartQuantity({}, MENU_ITEMS[10], 2); // Coffee Milk DSHYT x2 = 26.000
  const missingPhone = validateOrderForm(cart, {
    nama: 'Bayu Satrio',
    whatsapp: '123',
    pengiriman: 'Kampus',
    alamat: 'Gedung Kuliah Lt. 2',
    catatan: 'Kurang manis',
  });
  assert.equal(missingPhone.valid, false);
  assert.ok(missingPhone.fieldErrors.whatsapp);

  const validOrder = validateOrderForm(cart, {
    nama: 'Bayu Satrio',
    whatsapp: '081234567890',
    pengiriman: 'Luar Kampus',
    alamat: 'Jl. Gerilya No. 12',
    catatan: 'Titip di pos satpam',
  });
  assert.equal(validOrder.valid, true);
  assert.deepEqual(validOrder.payload, {
    nama: 'Bayu Satrio',
    whatsapp: '081234567890',
    pesanan: 'Coffee Milk DSHYT (2)',
    total: 'Rp 26.000',
    pengiriman: 'Luar Kampus',
    alamat: 'Jl. Gerilya No. 12',
    catatan: 'Titip di pos satpam',
  });
});

test('filterMenuItems filters by category and search text', () => {
  assert.equal(MENU_ITEMS.length, 11);
  const citrus = filterMenuItems(MENU_ITEMS, 'Citrus & Sparkling', '');
  assert.equal(citrus.length, 4);

  const orangeSearch = filterMenuItems(MENU_ITEMS, 'Semua', 'orange');
  assert.equal(orangeSearch.length, 3);
  assert.ok(orangeSearch.every((item) => item.name.toLowerCase().includes('orange')));
});
