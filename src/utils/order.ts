import type { MenuCategory, MenuItem } from '../data/menu';
import {
  PAYMENT_PROOF_DRIVE_FOLDER_ID,
  PAYMENT_PROOF_DRIVE_FOLDER_NAME,
} from './googleDrive';
import {
  generateOrderReference,
  getPaymentStatusForMethod,
  type UploadedPaymentProof,
} from './payment';

export type DeliveryType =
  | 'Delivery (Kampus)'
  | 'Delivery (Luar Kampus)'
  | 'Ambil di Tempat';

export type PaymentMethod = 'Cash' | 'QR';
export type PaymentStatus = 'Pending' | 'Menunggu Konfirmasi';

export type IceLevel = 'Normal Ice' | 'Less Ice' | 'No Ice';
export type SugarLevel = 'Normal Sugar' | 'Less Sugar' | 'No Sugar';

export const ICE_LEVELS: IceLevel[] = ['Normal Ice', 'Less Ice', 'No Ice'];
export const SUGAR_LEVELS: SugarLevel[] = ['Normal Sugar', 'Less Sugar', 'No Sugar'];
export const EXTRA_SHOT_PRICE = 9000;

export interface DrinkCustomization {
  ice: IceLevel;
  sugar: SugarLevel;
  extraShot: boolean;
  note: string;
}

export const DEFAULT_CUSTOMIZATION: DrinkCustomization = {
  ice: 'Normal Ice',
  sugar: 'Normal Sugar',
  extraShot: false,
  note: '',
};

export interface CartEntry {
  variantKey: string;
  menuId: string;
  name: string;
  cartKey: string;
  qty: number;
  basePrice: number;
  price: number;
  customization: DrinkCustomization;
}

export type CartState = Record<string, CartEntry>;

export interface OrderFormInput {
  nama: string;
  whatsapp: string;
  pengiriman: DeliveryType;
  alamat: string;
  metodePembayaran: PaymentMethod;
  catatan: string;
  paymentProof: UploadedPaymentProof | null;
}

export interface OrderSubmissionPayload {
  nama: string;
  whatsapp: string;
  pesanan: string;
  total: string;
  totalNumeric: number;
  pengiriman: DeliveryType;
  alamat: string;
  catatan: string;
  metodePembayaran: PaymentMethod;
  statusPembayaran: PaymentStatus;
  buktiPembayaran: string;
  fileData: string;
  fileName: string;
  fileType: string;
  kodeReferensi: string;
}

export interface AppsScriptOrderRequest {
  timestamp: string;
  kodeReferensi: string;
  nama: string;
  whatsapp: string;
  pesanan: string;
  total: string;
  pengiriman: DeliveryType;
  alamat: string;
  catatan: string;
  metodePembayaran: PaymentMethod;
  statusPembayaran: PaymentStatus;
  buktiPembayaran: string;
  driveFolderId: string;
  driveFolderName: string;
  fileData: string;
  fileName: string;
  fileType: string;
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

export function normalizeCustomization(
  input?: Partial<DrinkCustomization>
): DrinkCustomization {
  return {
    ice: input?.ice && ICE_LEVELS.includes(input.ice) ? input.ice : 'Normal Ice',
    sugar: input?.sugar && SUGAR_LEVELS.includes(input.sugar) ? input.sugar : 'Normal Sugar',
    extraShot: Boolean(input?.extraShot),
    note: input?.note ? input.note.trim() : '',
  };
}

export function calculateCustomizedUnitPrice(
  basePrice: number,
  customization: Pick<DrinkCustomization, 'extraShot'>
): number {
  return basePrice + (customization.extraShot ? EXTRA_SHOT_PRICE : 0);
}

export function buildCartVariantKey(
  cartKey: string,
  customization: DrinkCustomization
): string {
  const normalized = normalizeCustomization(customization);
  const noteKey = normalized.note.toLowerCase();
  return `${cartKey}__${normalized.ice}__${normalized.sugar}__${
    normalized.extraShot ? 'extra' : 'std'
  }__${noteKey}`;
}

export function formatCustomizationSummary(customization: DrinkCustomization): string {
  const normalized = normalizeCustomization(customization);
  const parts: string[] = [normalized.ice, normalized.sugar];
  if (normalized.extraShot) {
    parts.push('Extra Shot Espresso');
  }
  if (normalized.note) {
    parts.push(`Catatan: ${normalized.note}`);
  }
  return parts.join(', ');
}

export function addCustomizedCartItem(
  cart: CartState,
  item: Pick<MenuItem, 'id' | 'name' | 'cartKey' | 'price'>,
  customizationInput: Partial<DrinkCustomization> = DEFAULT_CUSTOMIZATION,
  quantity: number = 1
): CartState {
  const safeQty = Math.max(1, Math.floor(quantity));
  const customization = normalizeCustomization(customizationInput);
  const variantKey = buildCartVariantKey(item.cartKey, customization);
  const existing = cart[variantKey];
  const unitPrice = calculateCustomizedUnitPrice(item.price, customization);

  return {
    ...cart,
    [variantKey]: {
      variantKey,
      menuId: item.id,
      name: item.name,
      cartKey: item.cartKey,
      qty: (existing?.qty ?? 0) + safeQty,
      basePrice: item.price,
      price: unitPrice,
      customization,
    },
  };
}

export function updateCartVariantQuantity(
  cart: CartState,
  variantKey: string,
  delta: number
): CartState {
  const current = cart[variantKey];
  if (!current) return cart;

  const nextQty = Math.max(0, current.qty + delta);
  if (nextQty === 0) {
    const next = { ...cart };
    delete next[variantKey];
    return next;
  }

  return {
    ...cart,
    [variantKey]: {
      ...current,
      qty: nextQty,
    },
  };
}

export function decrementMenuItemLatestVariant(
  cart: CartState,
  menuId: string
): CartState {
  const matchingKeys = Object.keys(cart).filter(
    (key) => cart[key]?.menuId === menuId && cart[key].qty > 0
  );
  if (matchingKeys.length === 0) return cart;

  const targetKey = matchingKeys[matchingKeys.length - 1];
  return updateCartVariantQuantity(cart, targetKey, -1);
}

export function getMenuQuantityInCart(cart: CartState, menuId: string): number {
  let total = 0;
  for (const entry of Object.values(cart)) {
    if (entry.menuId === menuId && entry.qty > 0) {
      total += entry.qty;
    }
  }
  return total;
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
    const customLabel = formatCustomizationSummary(entry.customization);
    summaryParts.push(`${entry.cartKey} (${entry.qty}x - ${customLabel})`);
    payloadParts.push(`${entry.cartKey} (${entry.qty}x: ${customLabel})`);
  }

  return {
    totalItems,
    totalPrice,
    formattedTotal: formatRupiah(totalPrice),
    summaryText: summaryParts.join(' | '),
    payloadPesanan: payloadParts.join(' | '),
    entries,
  };
}

export function getDeliveryFieldConfig(deliveryType: DeliveryType): {
  label: string;
  placeholder: string;
  required: boolean;
} {
  if (deliveryType === 'Delivery (Kampus)') {
    return {
      label: 'Detail Lokasi / Gedung Kampus',
      placeholder: 'Contoh: Fakultas Teknik / Gedung Kuliah Lt. 2',
      required: true,
    };
  }

  if (deliveryType === 'Delivery (Luar Kampus)') {
    return {
      label: 'Alamat Lengkap Kos / Rumah',
      placeholder: 'Contoh: Jl. Gerilya No. XX (Kos pagar hijau)',
      required: true,
    };
  }

  return {
    label: 'Jam / Catatan Pengambilan (Opsional)',
    placeholder: 'Contoh: Diambil jam 13.00 di booth Kopi D\'SHYT',
    required: false,
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
  form: OrderFormInput,
  kodeReferensi?: string
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
  const deliveryConfig = getDeliveryFieldConfig(form.pengiriman);
  const alamatInput = form.alamat.trim();
  const resolvedAlamat =
    alamatInput ||
    (form.pengiriman === 'Ambil di Tempat'
      ? "Ambil langsung di booth Kopi D'SHYT"
      : '');
  const catatan = form.catatan.trim();
  const metodePembayaran: PaymentMethod = form.metodePembayaran === 'QR' ? 'QR' : 'Cash';
  const statusPembayaran = getPaymentStatusForMethod(metodePembayaran);
  const resolvedRef = kodeReferensi?.trim() || generateOrderReference();

  if (!nama) {
    fieldErrors.nama = 'Nama lengkap wajib diisi.';
  }

  if (!whatsappRaw) {
    fieldErrors.whatsapp = 'Nomor WhatsApp wajib diisi.';
  } else if (whatsappDigits.length < 9 || whatsappDigits.length > 15) {
    fieldErrors.whatsapp = 'Masukkan nomor WhatsApp yang valid (9–15 digit).';
  }

  if (deliveryConfig.required && !alamatInput) {
    fieldErrors.alamat =
      form.pengiriman === 'Delivery (Kampus)'
        ? 'Detail lokasi atau gedung kampus wajib diisi.'
        : 'Alamat lengkap kos atau rumah wajib diisi.';
  }

  if (metodePembayaran === 'QR' && !form.paymentProof?.fileData) {
    fieldErrors.paymentProof =
      'Silakan unggah screenshot / bukti transfer QR terlebih dahulu.';
  }

  const firstError = Object.values(fieldErrors)[0];
  if (firstError) {
    return {
      valid: false,
      errorMessage: firstError,
      fieldErrors,
    };
  }

  const isQr = metodePembayaran === 'QR';
  const proof = isQr ? form.paymentProof : null;

  return {
    valid: true,
    fieldErrors: {},
    payload: {
      nama,
      whatsapp: whatsappRaw,
      pesanan: totals.payloadPesanan,
      total: totals.formattedTotal,
      totalNumeric: totals.totalPrice,
      pengiriman: form.pengiriman,
      alamat: resolvedAlamat,
      catatan,
      metodePembayaran,
      statusPembayaran,
      buktiPembayaran: isQr ? '' : '-',
      fileData: proof?.fileData ?? '',
      fileName: proof?.fileName ?? '',
      fileType: proof?.fileType ?? '',
      kodeReferensi: resolvedRef,
    },
  };
}

export function buildOrderRequestBody(
  payload: OrderSubmissionPayload,
  timestamp: string = new Date().toISOString()
): AppsScriptOrderRequest {
  const isCash = payload.metodePembayaran === 'Cash';

  return {
    timestamp,
    kodeReferensi: payload.kodeReferensi,
    nama: payload.nama,
    whatsapp: payload.whatsapp,
    pesanan: payload.pesanan,
    total: payload.total,
    pengiriman: payload.pengiriman,
    alamat: payload.alamat,
    catatan: payload.catatan,
    metodePembayaran: isCash ? 'Cash' : 'QR',
    statusPembayaran: isCash ? 'Pending' : payload.statusPembayaran,
    buktiPembayaran: isCash ? '-' : payload.buktiPembayaran,
    driveFolderId: PAYMENT_PROOF_DRIVE_FOLDER_ID,
    driveFolderName: PAYMENT_PROOF_DRIVE_FOLDER_NAME,
    fileData: isCash ? '' : payload.fileData,
    fileName: isCash ? '' : payload.fileName,
    fileType: isCash ? '' : payload.fileType,
  };
}

export function parseOrderScriptResponse(rawText: string): {
  ok: boolean;
  message?: string;
  buktiPembayaran?: string;
} {
  const trimmed = rawText.trim();
  if (!trimmed) return { ok: true };

  try {
    const parsed = JSON.parse(trimmed) as {
      status?: string;
      message?: string;
      buktiPembayaran?: string;
    };
    if (parsed && parsed.status === 'error') {
      return {
        ok: false,
        message: parsed.message || 'Gagal mencatat pesanan ke database.',
      };
    }
    return {
      ok: true,
      buktiPembayaran:
        typeof parsed?.buktiPembayaran === 'string' && parsed.buktiPembayaran.trim()
          ? parsed.buktiPembayaran.trim()
          : undefined,
    };
  } catch {
    return { ok: true };
  }
}
