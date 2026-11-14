import { type FormEvent, useMemo, useState } from 'react';
import { ArrowDown, Search, ShoppingBag, X } from 'lucide-react';
import {
  MENU_CATEGORIES,
  MENU_ITEMS,
  ORDER_SCRIPT_URL,
  type MenuCategory,
  type MenuItem,
} from './data/menu';
import {
  calculateCartTotals,
  filterMenuItems,
  updateCartQuantity,
  validateOrderForm,
  type CartState,
  type OrderFormInput,
  type OrderSubmissionPayload,
} from './utils/order';
import { MenuCard } from './components/MenuCard';
import { CheckoutPanel } from './components/CheckoutPanel';

const INITIAL_FORM: OrderFormInput = {
  nama: '',
  whatsapp: '',
  pengiriman: 'Kampus',
  alamat: '',
  catatan: '',
};

export default function App() {
  const [cart, setCart] = useState<CartState>({});
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<OrderFormInput>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof OrderFormInput | 'cart', string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<OrderSubmissionPayload | null>(null);

  const totals = useMemo(() => calculateCartTotals(cart), [cart]);

  const filteredMenu = useMemo(
    () => filterMenuItems(MENU_ITEMS, activeCategory, searchQuery),
    [activeCategory, searchQuery]
  );

  function handleChangeQuantity(item: MenuItem, delta: number) {
    setSubmittedReceipt(null);
    setSubmitError(null);
    setFieldErrors((prev) => ({ ...prev, cart: undefined }));
    setCart((prev) => updateCartQuantity(prev, item, delta));
  }

  function handleClearCart() {
    setCart({});
    setFieldErrors((prev) => ({ ...prev, cart: undefined }));
  }

  function handleFieldChange<K extends keyof OrderFormInput>(
    field: K,
    value: OrderFormInput[K]
  ) {
    setSubmitError(null);
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const validation = validateOrderForm(cart, form);
    if (!validation.valid || !validation.payload) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch(ORDER_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(validation.payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setSubmittedReceipt(validation.payload);
      setCart({});
      setForm(INITIAL_FORM);
    } catch {
      setSubmitError(
        'Gagal mengirim pesanan. Periksa koneksi internet Anda lalu coba kirim ulang.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleStartNewOrder() {
    setSubmittedReceipt(null);
    setSubmitError(null);
    setFieldErrors({});
  }

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1614] pb-20 lg:pb-0">
      {/* Three-Zone Top Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E7E2DA] bg-[#FAF8F5]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          <a
            href="#top"
            className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[#1A1614] whitespace-nowrap shrink-0"
          >
            Kopi D&apos;SHYT
          </a>

          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5E544E]"
          >
            <a
              href="#menu"
              className="hover:text-[#1A1614] transition-colors whitespace-nowrap shrink-0"
            >
              Menu
            </a>
            <a
              href="#cara-pesan"
              className="hover:text-[#1A1614] transition-colors whitespace-nowrap shrink-0"
            >
              Cara Pesan
            </a>
            <a
              href="#checkout"
              className="hover:text-[#1A1614] transition-colors whitespace-nowrap shrink-0"
            >
              Checkout
            </a>
          </nav>

          <button
            type="button"
            onClick={() => scrollToSection('checkout')}
            aria-label={`Lihat keranjang, ${totals.totalItems} item`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1A1614] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#C2410C] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Keranjang</span>
            <span className="font-mono tabular-nums">({totals.totalItems})</span>
          </button>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* Hero Split */}
        <section className="py-8 sm:py-10 lg:py-12">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
            <div className="flex flex-col justify-between lg:col-span-6 lg:py-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A3412]">
                  Pre-Order Harian · Kampus &amp; Sekitar
                </p>
                <h1 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(2.25rem,4vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-[#1A1614] [text-wrap:balance]">
                  Ngopi dulu, panik kemudian.
                </h1>
                <p className="mt-4 max-w-[54ch] text-base leading-relaxed text-[#5E544E]">
                  Pilih 11 menu favoritmu di bawah ini — mulai dari espresso pouch praktis,
                  kopi susu signature, hingga racikan jeruk segar untuk menemani kuliah dan
                  deadline.
                </p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <a
                  href="#menu"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#C2410C] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] whitespace-nowrap shrink-0"
                >
                  <span>Pilih Menu Sekarang</span>
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
                <span className="text-sm text-[#786D65]">
                  11 varian tersedia · Mulai Rp 10.000
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[240px] sm:min-h-[300px] overflow-hidden rounded-xl border border-[#E7E2DA] bg-[#EFEAE2]">
                <img
                  src="/src/assets/images/kopi_dshyt_banner_1794658694371.jpg"
                  alt="Es kopi jeruk dan kopi susu khas Kopi D'SHYT di atas meja batu travertine"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 3-Step Strip Below Hero */}
          <div
            id="cara-pesan"
            className="mt-8 grid grid-cols-1 gap-4 border-y border-[#E7E2DA] py-5 sm:grid-cols-3 sm:gap-6"
          >
            <div>
              <p className="text-xs font-semibold text-[#9A3412]">01. Pilih Menu</p>
              <p className="mt-1 text-sm text-[#5E544E]">
                Tentukan jumlah dari 11 pilihan kopi dan minuman citrus segar.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#9A3412]">02. Tentukan Lokasi</p>
              <p className="mt-1 text-sm text-[#5E544E]">
                Pilih pengantaran area gedung kampus atau alamat kos luar kampus.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#9A3412]">03. Tercatat Otomatis</p>
              <p className="mt-1 text-sm text-[#5E544E]">
                Pesanan langsung masuk ke daftar antrean produksi &amp; kurir kami.
              </p>
            </div>
          </div>
        </section>

        {/* Catalog & Sticky Checkout Workspace */}
        <section
          id="menu"
          aria-label="Daftar Menu Kopi D'SHYT"
          className="pb-16 pt-2 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start"
        >
          <div>
            <div className="flex flex-col gap-4 pb-6 border-b border-[#E7E2DA] sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#1A1614]">
                  1. Pilih Menu Kopi &amp; Minuman
                </h2>
                <p className="mt-1 text-sm text-[#5E544E]">
                  Menampilkan {filteredMenu.length} dari {MENU_ITEMS.length} menu
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#786D65]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu..."
                  aria-label="Cari menu kopi"
                  className="h-10 w-full rounded-lg border border-[#DDD6CC] bg-white pl-9 pr-8 text-sm text-[#1A1614] placeholder:text-[#9C9189] focus:border-[#C2410C] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Hapus pencarian"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#786D65] hover:text-[#1A1614] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div
              role="tablist"
              aria-label="Filter kategori menu"
              className="mt-4 flex flex-wrap items-center gap-1.5"
            >
              {MENU_CATEGORIES.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCategory(category)}
                    className={`h-9 rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#1A1614] text-white'
                        : 'bg-[#EFEAE2] text-[#5E544E] hover:bg-[#E5DFD5] hover:text-[#1A1614]'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {filteredMenu.length === 0 ? (
              <div className="mt-6 rounded-xl border border-[#E7E2DA] bg-white p-10 text-center">
                <p className="text-base font-semibold text-[#1A1614]">
                  Menu tidak ditemukan
                </p>
                <p className="mt-1 text-sm text-[#5E544E]">
                  Coba kata kunci lain atau tampilkan semua kategori menu.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('Semua');
                    setSearchQuery('');
                  }}
                  className="mt-4 inline-flex h-10 items-center rounded-lg bg-[#1A1614] px-4 text-sm font-medium text-white hover:bg-[#C2410C] cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredMenu.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    quantity={cart[item.cartKey]?.qty ?? 0}
                    onChangeQuantity={handleChangeQuantity}
                  />
                ))}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:rounded-xl">
            <CheckoutPanel
              cart={cart}
              menuItems={MENU_ITEMS}
              form={form}
              fieldErrors={fieldErrors}
              submitError={submitError}
              isSubmitting={isSubmitting}
              submittedReceipt={submittedReceipt}
              onChangeQuantity={handleChangeQuantity}
              onClearCart={handleClearCart}
              onFieldChange={handleFieldChange}
              onSubmit={handleSubmit}
              onStartNewOrder={handleStartNewOrder}
            />
          </aside>
        </section>
      </main>

      {/* Mobile Compact Sticky Bottom Summary Bar (<= 15% of viewport height) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E7E2DA] bg-white/95 backdrop-blur-sm px-4 py-2.5 lg:hidden">
        <div className="mx-auto flex max-w-[650px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[#786D65]">
              {totals.totalItems > 0
                ? `${totals.totalItems} item dipilih`
                : 'Belum ada pesanan'}
            </p>
            <p className="font-mono text-sm font-bold tabular-nums text-[#1A1614]">
              {totals.formattedTotal}
            </p>
          </div>
          <button
            type="button"
            onClick={() => scrollToSection('checkout')}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#C2410C] px-4 text-xs font-semibold text-white hover:bg-[#9A3412] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Lanjut Pesan</span>
          </button>
        </div>
      </div>

      <footer className="border-t border-[#E7E2DA] bg-[#FAF8F5] py-8">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-3 px-4 text-xs text-[#786D65] sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="font-medium text-[#5E544E]">
            Kopi D&apos;SHYT — Ngopi dulu, panik kemudian.
          </p>
          <p>Pre-order harian untuk pengantaran area kampus &amp; kos sekitar.</p>
        </div>
      </footer>
    </div>
  );
}
