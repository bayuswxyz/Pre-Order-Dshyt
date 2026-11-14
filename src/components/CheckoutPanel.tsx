import { type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import type { MenuItem } from '../data/menu';
import {
  calculateCartTotals,
  formatRupiah,
  getDeliveryFieldConfig,
  type CartState,
  type DeliveryType,
  type OrderFormInput,
  type OrderSubmissionPayload,
} from '../utils/order';

interface CheckoutPanelProps {
  cart: CartState;
  menuItems: MenuItem[];
  form: OrderFormInput;
  fieldErrors: Partial<Record<keyof OrderFormInput | 'cart', string>>;
  submitError: string | null;
  isSubmitting: boolean;
  submittedReceipt: OrderSubmissionPayload | null;
  onChangeQuantity: (item: MenuItem, delta: number) => void;
  onClearCart: () => void;
  onFieldChange: <K extends keyof OrderFormInput>(field: K, value: OrderFormInput[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStartNewOrder: () => void;
}

export function CheckoutPanel({
  cart,
  menuItems,
  form,
  fieldErrors,
  submitError,
  isSubmitting,
  submittedReceipt,
  onChangeQuantity,
  onClearCart,
  onFieldChange,
  onSubmit,
  onStartNewOrder,
}: CheckoutPanelProps) {
  const totals = calculateCartTotals(cart);
  const deliveryConfig = getDeliveryFieldConfig(form.pengiriman);
  const menuByKey = new Map(menuItems.map((m) => [m.cartKey, m]));

  if (submittedReceipt) {
    return (
      <section
        id="checkout"
        aria-label="Konfirmasi Pre-Order"
        data-testid="order-receipt"
        className="rounded-xl border border-[#D8E2D8] bg-white p-6 shadow-[0_8px_30px_-12px_rgba(26,22,20,0.08)]"
      >
        <div className="flex items-start gap-3 pb-4 border-b border-[#EFEAE2]">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-[#15803D] mt-0.5" aria-hidden="true" />
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[#1A1614]">
              Pre-Order Terkirim
            </h2>
            <p className="mt-1 text-sm text-[#5E544E]">
              Yeay! Pre-order berhasil dikirim dan tercatat otomatis di Google Sheets.
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[#786D65]">Pemesan</dt>
            <dd className="font-medium text-right text-[#1A1614]">{submittedReceipt.nama}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#786D65]">WhatsApp</dt>
            <dd className="font-mono text-right text-[#1A1614] tabular-nums">
              {submittedReceipt.whatsapp}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#786D65]">Pengiriman</dt>
            <dd className="font-medium text-right text-[#1A1614]">
              {submittedReceipt.pengiriman}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[#786D65]">Lokasi</dt>
            <dd className="font-medium text-right text-[#1A1614] max-w-[220px]">
              {submittedReceipt.alamat}
            </dd>
          </div>
          {submittedReceipt.catatan && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#786D65]">Catatan</dt>
              <dd className="text-right text-[#1A1614] max-w-[220px]">
                {submittedReceipt.catatan}
              </dd>
            </div>
          )}
          <div className="pt-3 border-t border-[#EFEAE2]">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#786D65]">
              Menu Dipesan
            </dt>
            <dd className="mt-1.5 text-sm font-medium text-[#1A1614]">
              {submittedReceipt.pesanan}
            </dd>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#EFEAE2]">
            <dt className="font-semibold text-[#1A1614]">Total Pembayaran</dt>
            <dd className="font-mono text-lg font-bold text-[#9A3412] tabular-nums">
              {submittedReceipt.total}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onStartNewOrder}
          className="mt-6 w-full h-11 rounded-lg bg-[#1A1614] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#C2410C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] cursor-pointer"
        >
          Buat Pesanan Baru
        </button>
      </section>
    );
  }

  return (
    <section
      id="checkout"
      aria-label="Ringkasan Pesanan dan Checkout"
      className="rounded-xl border border-[#E7E2DA] bg-white p-5 sm:p-6 shadow-[0_8px_30px_-12px_rgba(26,22,20,0.06)]"
    >
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#EFEAE2]">
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingBag className="h-5 w-5 shrink-0 text-[#C2410C]" aria-hidden="true" />
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#1A1614] whitespace-nowrap">
            Ringkasan Pesanan
          </h2>
        </div>
        {totals.totalItems > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            aria-label="Kosongkan keranjang"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#786D65] transition-colors hover:bg-[#FAF8F5] hover:text-[#B91C1C] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Kosongkan</span>
          </button>
        )}
      </div>

      {/* Cart Summary */}
      <div className="py-4 border-b border-[#EFEAE2]">
        {totals.entries.length === 0 ? (
          <p data-testid="empty-cart-text" className="text-sm text-[#786D65]">
            Belum ada menu yang dipilih. Tekan tombol Tambah pada daftar menu di samping.
          </p>
        ) : (
          <ul className="space-y-3" data-testid="cart-items-list">
            {totals.entries.map((entry) => {
              const menuItem = menuByKey.get(entry.cartKey);
              return (
                <li
                  key={entry.cartKey}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#1A1614] truncate">{entry.name}</p>
                    <p className="font-mono text-xs text-[#786D65] tabular-nums">
                      {formatRupiah(entry.price)} × {entry.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {menuItem && (
                      <>
                        <button
                          type="button"
                          onClick={() => onChangeQuantity(menuItem, -1)}
                          aria-label={`Kurangi ${entry.name} di keranjang`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E7E2DA] bg-[#FAF8F5] text-[#1A1614] hover:bg-[#EFEAE2] cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangeQuantity(menuItem, 1)}
                          aria-label={`Tambah ${entry.name} di keranjang`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E7E2DA] bg-[#FAF8F5] text-[#1A1614] hover:bg-[#EFEAE2] cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </>
                    )}
                    <span className="w-20 text-right font-mono text-xs font-semibold tabular-nums text-[#1A1614]">
                      {formatRupiah(entry.price * entry.qty)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between rounded-lg bg-[#FAF8F5] px-3.5 py-3 border border-[#EFEAE2]">
          <span className="text-sm font-medium text-[#5E544E]">
            Total Pembayaran ({totals.totalItems} item)
          </span>
          <span
            data-testid="cart-total"
            className="font-mono text-base font-bold tabular-nums text-[#9A3412]"
          >
            {totals.formattedTotal}
          </span>
        </div>
      </div>

      {/* Customer & Delivery Form */}
      <form onSubmit={onSubmit} noValidate className="mt-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#1A1614]">
          Informasi Pemesan &amp; Pengiriman
        </h3>

        {(fieldErrors.cart || submitError) && (
          <div
            role="alert"
            data-testid="form-error-banner"
            className="flex items-start gap-2.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-sm text-[#991B1B]"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{submitError || fieldErrors.cart}</span>
          </div>
        )}

        <div>
          <label htmlFor="nama" className="block text-sm font-medium text-[#1A1614] mb-1">
            Nama Lengkap
          </label>
          <input
            id="nama"
            name="nama"
            type="text"
            value={form.nama}
            onChange={(e) => onFieldChange('nama', e.target.value)}
            placeholder="Contoh: Bayu Satrio"
            required
            aria-invalid={Boolean(fieldErrors.nama)}
            className={`w-full h-10 rounded-lg border px-3.5 text-sm text-[#1A1614] placeholder:text-[#9C9189] bg-[#FAF8F5] transition-colors focus:bg-white focus:outline-none ${
              fieldErrors.nama
                ? 'border-[#DC2626] focus:border-[#DC2626]'
                : 'border-[#DDD6CC] focus:border-[#C2410C]'
            }`}
          />
          {fieldErrors.nama && (
            <p className="mt-1 text-xs text-[#B91C1C]">{fieldErrors.nama}</p>
          )}
        </div>

        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium text-[#1A1614] mb-1">
            Nomor WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            value={form.whatsapp}
            onChange={(e) => onFieldChange('whatsapp', e.target.value)}
            placeholder="Contoh: 081234567890"
            required
            aria-invalid={Boolean(fieldErrors.whatsapp)}
            className={`w-full h-10 rounded-lg border px-3.5 text-sm text-[#1A1614] placeholder:text-[#9C9189] bg-[#FAF8F5] transition-colors focus:bg-white focus:outline-none ${
              fieldErrors.whatsapp
                ? 'border-[#DC2626] focus:border-[#DC2626]'
                : 'border-[#DDD6CC] focus:border-[#C2410C]'
            }`}
          />
          {fieldErrors.whatsapp && (
            <p className="mt-1 text-xs text-[#B91C1C]">{fieldErrors.whatsapp}</p>
          )}
        </div>

        <div>
          <label htmlFor="pengiriman" className="block text-sm font-medium text-[#1A1614] mb-1">
            Tipe Pengiriman
          </label>
          <select
            id="pengiriman"
            name="pengiriman"
            value={form.pengiriman}
            onChange={(e) => onFieldChange('pengiriman', e.target.value as DeliveryType)}
            className="w-full h-10 rounded-lg border border-[#DDD6CC] bg-[#FAF8F5] px-3.5 text-sm text-[#1A1614] transition-colors focus:border-[#C2410C] focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="Kampus">Kampus (In-Campus)</option>
            <option value="Luar Kampus">Luar Kampus (Off-Campus / Kos)</option>
          </select>
        </div>

        <div>
          <label
            id="labelAlamat"
            htmlFor="alamat"
            className="block text-sm font-medium text-[#1A1614] mb-1"
          >
            {deliveryConfig.label}
          </label>
          <input
            id="alamat"
            name="alamat"
            type="text"
            value={form.alamat}
            onChange={(e) => onFieldChange('alamat', e.target.value)}
            placeholder={deliveryConfig.placeholder}
            required
            aria-invalid={Boolean(fieldErrors.alamat)}
            className={`w-full h-10 rounded-lg border px-3.5 text-sm text-[#1A1614] placeholder:text-[#9C9189] bg-[#FAF8F5] transition-colors focus:bg-white focus:outline-none ${
              fieldErrors.alamat
                ? 'border-[#DC2626] focus:border-[#DC2626]'
                : 'border-[#DDD6CC] focus:border-[#C2410C]'
            }`}
          />
          {fieldErrors.alamat && (
            <p className="mt-1 text-xs text-[#B91C1C]">{fieldErrors.alamat}</p>
          )}
        </div>

        <div>
          <label htmlFor="catatan" className="block text-sm font-medium text-[#1A1614] mb-1">
            Catatan Tambahan / Kurir (Opsional)
          </label>
          <input
            id="catatan"
            name="catatan"
            type="text"
            value={form.catatan}
            onChange={(e) => onFieldChange('catatan', e.target.value)}
            placeholder="Contoh: Kurang manis / Titip di pos satpam"
            className="w-full h-10 rounded-lg border border-[#DDD6CC] bg-[#FAF8F5] px-3.5 text-sm text-[#1A1614] placeholder:text-[#9C9189] transition-colors focus:border-[#C2410C] focus:bg-white focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="submit-order-btn"
          className="mt-1 inline-flex w-full h-11 items-center justify-center gap-2 rounded-lg bg-[#C2410C] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] disabled:opacity-65 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Sedang mengirim pesanan...</span>
            </>
          ) : (
            <span>Kirim Pre-Order Sekarang</span>
          )}
        </button>
      </form>
    </section>
  );
}
