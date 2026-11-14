import type { MenuCategory, MenuItem } from '../data/menu';

export type DeliveryType = 'Kampus' | 'Luar Kampus';

export interface CartEntry {
  name: string;
  cartKey: string;
  qty: number;
  price: number;
}

export type CartState = Record<string, CartEntry>;

export interface OrderFormInput {
  nama: string;
  whatsapp: string;
  pengiriman: DeliveryType;
  alamat: string;
  catatan: string;
}

export interface OrderSubmissionPayload {
  nama: string;
  whatsapp: string;
  pesanan: string;
  total: string;
  pengiriman: DeliveryType;
  alamat: string;
  catatan: string;
}

export interface CartTotals {
  totalItems: number;
  totalPrice: number;
  formattedTotal: string;
  summaryText: string;
  payloadPesanan: string;
  entries: CartEntry[];
}

export interface ValidationResult {
  valid: boolean;
  errorMessage?: string;
  fieldErrors: Partial<Record<keyof OrderFormInput | 'cart', string>>;
  payload?: OrderSubmissionPayload;
}

export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) && amount > 0 ? Math.round(amount) : 0;
  return `Rp ${safe.toLocaleString('id-ID')}`;
}

export function updateCartQuantity(
  cart: CartState,
  item: Pick<MenuItem, 'name' | 'cartKey' | 'price'>,
  delta: number
): CartState {
  const current = cart[item.cartKey];
  const nextQty = Math.max(0, (current?.qty ?? 0) + delta);

  if (nextQty === 0) {
    if (!current) return cart;
    const next = { ...cart };
    delete next[item.cartKey];
    return next;
  }

  return {
    ...cart,
    [item.cartKey]: {
      name: item.name,
      cartKey: item.cartKey,
      qty: nextQty,
      price: item.price,
    },
  };
}

export function calculateCartTotals(cart: CartState): CartTotals {
  const entries = Object.values(cart).filter((entry) => entry.qty > 0);
  if (entries.length === 0) {
    return {
      totalItems: 0,
      totalPrice: 0,
      formattedTotal: formatRupiah(0),
      summaryText: 'Belum ada menu yang dipilih.',
      payloadPesanan: '',
      entries: [],
    };
  }

  let totalItems = 0;
  let totalPrice = 0;
  const summaryParts: string[] = [];
  const payloadParts: string[] = [];

  for (const entry of entries) {
    totalItems += entry.qty;
    totalPrice += entry.qty * entry.price;
    summaryParts.push(`${entry.cartKey} (${entry.qty}x)`);
    payloadParts.push(`${entry.cartKey} (${entry.qty})`);
  }

  return {
    totalItems,
    totalPrice,
    formattedTotal: formatRupiah(totalPrice),
    summaryText: summaryParts.join(', '),
    payloadPesanan: payloadParts.join(', '),
    entries,
  };
}

export function getDeliveryFieldConfig(deliveryType: DeliveryType): {
  label: string;
  placeholder: string;
} {
  if (deliveryType === 'Kampus') {
    return {
      label: 'Detail Lokasi / Gedung Kampus',
      placeholder: 'Contoh: Fakultas Teknik / Gedung Kuliah Lt. 2',
    };
  }

  return {
    label: 'Alamat Lengkap Kos / Rumah',
    placeholder: 'Contoh: Jl. Gerilya No. XX (Kos pagar hijau)',
  };
}

export function filterMenuItems(
  items: MenuItem[],
  category: MenuCategory,
  searchQuery: string
): MenuItem[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    const matchesCategory = category === 'Semua' || item.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    return (
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.note.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function validateOrderForm(
  cart: CartState,
  form: OrderFormInput
): ValidationResult {
  const totals = calculateCartTotals(cart);
  const fieldErrors: Partial<Record<keyof OrderFormInput | 'cart', string>> = {};

  if (totals.totalItems === 0) {
    fieldErrors.cart = 'Silakan pilih minimal 1 menu kopi terlebih dahulu!';
    return {
      valid: false,
      errorMessage: fieldErrors.cart,
      fieldErrors,
    };
  }

  const nama = form.nama.trim();
  const whatsappRaw = form.whatsapp.trim();
  const whatsappDigits = whatsappRaw.replace(/[^\d]/g, '');
  const alamat = form.alamat.trim();
  const catatan = form.catatan.trim();

  if (!nama) {
    fieldErrors.nama = 'Nama lengkap wajib diisi.';
  }

  if (!whatsappRaw) {
    fieldErrors.whatsapp = 'Nomor WhatsApp wajib diisi.';
  } else if (whatsappDigits.length < 9 || whatsappDigits.length > 15) {
    fieldErrors.whatsapp = 'Masukkan nomor WhatsApp yang valid (9–15 digit).';
  }

  if (!alamat) {
    fieldErrors.alamat =
      form.pengiriman === 'Kampus'
        ? 'Detail lokasi atau gedung kampus wajib diisi.'
        : 'Alamat lengkap kos atau rumah wajib diisi.';
  }

  const firstError = Object.values(fieldErrors)[0];
  if (firstError) {
    return {
      valid: false,
      errorMessage: firstError,
      fieldErrors,
    };
  }

  return {
    valid: true,
    fieldErrors: {},
    payload: {
      nama,
      whatsapp: whatsappRaw,
      pesanan: totals.payloadPesanan,
      total: totals.formattedTotal,
      pengiriman: form.pengiriman,
      alamat,
      catatan,
    },
  };
}
