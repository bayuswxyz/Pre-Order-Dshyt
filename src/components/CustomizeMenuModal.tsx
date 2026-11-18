import { useEffect, useState } from 'react';
import { Coffee, Minus, Plus, Sparkles, X } from 'lucide-react';
import type { MenuItem } from '../data/menu';
import { FALLBACK_IMAGES } from '../data/fallbackImages';
import {
  calculateCustomizedUnitPrice,
  DEFAULT_CUSTOMIZATION,
  EXTRA_SHOT_PRICE,
  formatRupiah,
  ICE_LEVELS,
  SUGAR_LEVELS,
  type DrinkCustomization,
  type IceLevel,
  type SugarLevel,
} from '../utils/order';

interface CustomizeMenuModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onConfirm: (item: MenuItem, customization: DrinkCustomization, quantity: number) => void;
}

export function CustomizeMenuModal({
  item,
  onClose,
  onConfirm,
}: CustomizeMenuModalProps) {
  const [ice, setIce] = useState<IceLevel>(DEFAULT_CUSTOMIZATION.ice);
  const [sugar, setSugar] = useState<SugarLevel>(DEFAULT_CUSTOMIZATION.sugar);
  const [extraShot, setExtraShot] = useState<boolean>(DEFAULT_CUSTOMIZATION.extraShot);
  const [note, setNote] = useState<string>(DEFAULT_CUSTOMIZATION.note);
  const [quantity, setQuantity] = useState<number>(1);
  const [useFallbackImg, setUseFallbackImg] = useState(false);

  useEffect(() => {
    if (!item) return;
    setIce(DEFAULT_CUSTOMIZATION.ice);
    setSugar(DEFAULT_CUSTOMIZATION.sugar);
    setExtraShot(DEFAULT_CUSTOMIZATION.extraShot);
    setNote(DEFAULT_CUSTOMIZATION.note);
    setQuantity(1);
    setUseFallbackImg(false);
  }, [item]);

  useEffect(() => {
    if (!item) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const unitPrice = calculateCustomizedUnitPrice(item.price, { extraShot });
  const totalPrice = unitPrice * quantity;

  function handleConfirm() {
    if (!item) return;
    onConfirm(
      item,
      {
        ice,
        sugar,
        extraShot,
        note: note.trim(),
      },
      quantity
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1614]/65 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-modal-title"
        data-testid="customize-menu-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-[#E7E2DA] bg-[#FAF8F5] p-5 sm:p-6 shadow-[0_24px_60px_-16px_rgba(26,22,20,0.45)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup kustomisasi menu"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E7E2DA] bg-white text-[#5E544E] transition-colors hover:bg-[#EFEAE2] hover:text-[#1A1614] cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Product Header */}
        <div className="flex items-start gap-3.5 pr-12 pb-4 border-b border-[#E7E2DA]">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#E7E2DA] bg-[#EFEAE2]">
            <img
              src={useFallbackImg ? FALLBACK_IMAGES[item.fallbackKey] : item.imageUrl}
              alt={item.name}
              onError={() => setUseFallbackImg(true)}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9A3412]">
              {item.category}
            </p>
            <h2
              id="customize-modal-title"
              className="mt-0.5 font-[family-name:var(--font-display)] text-xl font-bold leading-snug text-[#1A1614]"
            >
              {item.name}
            </h2>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-[#5E544E]">
              Harga dasar {formatRupiah(item.price)}
            </p>
          </div>
        </div>

        {!item.disableCustomization && (
          <div className="mt-4 space-y-4">
            {/* Level Es */}
            <div>
              <span
                id="ice-level-label"
                className="block text-sm font-semibold text-[#1A1614] mb-2"
              >
                Level Es
              </span>
              <div
                role="radiogroup"
                aria-labelledby="ice-level-label"
                className="grid grid-cols-3 gap-2"
              >
                {ICE_LEVELS.map((option) => {
                  const active = ice === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      data-testid={`ice-${option.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setIce(option)}
                      className={`h-10 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'border-[#C2410C] bg-[#FFF8F3] text-[#9A3412]'
                          : 'border-[#DDD6CC] bg-white text-[#5E544E] hover:border-[#C2410C]/45 hover:text-[#1A1614]'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level Gula */}
            <div>
              <span
                id="sugar-level-label"
                className="block text-sm font-semibold text-[#1A1614] mb-2"
              >
                Level Gula
              </span>
              <div
                role="radiogroup"
                aria-labelledby="sugar-level-label"
                className="grid grid-cols-3 gap-2"
              >
                {SUGAR_LEVELS.map((option) => {
                  const active = sugar === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      data-testid={`sugar-${option.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setSugar(option)}
                      className={`h-10 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'border-[#C2410C] bg-[#FFF8F3] text-[#9A3412]'
                          : 'border-[#DDD6CC] bg-white text-[#5E544E] hover:border-[#C2410C]/45 hover:text-[#1A1614]'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Extra Shot Espresso */}
            <div>
              <span className="block text-sm font-semibold text-[#1A1614] mb-2">
                Tambahan (Opsional)
              </span>
              <button
                type="button"
                role="checkbox"
                aria-checked={extraShot}
                data-testid="extra-shot-toggle"
                onClick={() => setExtraShot((prev) => !prev)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                  extraShot
                    ? 'border-[#C2410C] bg-[#FFF8F3]'
                    : 'border-[#DDD6CC] bg-white hover:border-[#C2410C]/45'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      extraShot ? 'bg-[#C2410C] text-white' : 'bg-[#EFEAE2] text-[#5E544E]'
                    }`}
                  >
                    {extraShot ? (
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Coffee className="h-4 w-4" aria-hidden="true" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1A1614]">Extra Shot Espresso</p>
                    <p className="text-xs text-[#786D65]">
                      Tambahan 1 shot espresso untuk rasa kopi lebih mantap
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold tabular-nums text-[#9A3412] whitespace-nowrap shrink-0">
                  +{formatRupiah(EXTRA_SHOT_PRICE)}
                </span>
              </button>
            </div>

            {/* Catatan Khusus */}
            <div>
              <label
                htmlFor="custom-drink-note"
                className="block text-sm font-semibold text-[#1A1614] mb-1.5"
              >
                Catatan Khusus (Opsional)
              </label>
              <textarea
                id="custom-drink-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Es dipisah, minta sedotan kertas, dll."
                className="w-full rounded-lg border border-[#DDD6CC] bg-white px-3.5 py-2.5 text-sm text-[#1A1614] placeholder:text-[#9C9189] transition-colors focus:border-[#C2410C] focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Footer: Qty + Add CTA */}
        <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-[#E7E2DA]">
          <div className="flex items-center justify-between sm:justify-start gap-2 rounded-lg border border-[#DDD6CC] bg-white px-2 py-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Kurangi jumlah"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#1A1614] hover:bg-[#EFEAE2] cursor-pointer"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span
              data-testid="customize-qty-value"
              className="w-8 text-center font-mono text-sm font-bold tabular-nums text-[#1A1614]"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Tambah jumlah"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#1A1614] hover:bg-[#EFEAE2] cursor-pointer"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            data-testid="confirm-customize-btn"
            className="inline-flex h-11 w-full sm:w-auto sm:flex-1 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#C2410C] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] cursor-pointer"
          >
            <span>Tambah ke Keranjang</span>
            <span className="font-mono tabular-nums">· {formatRupiah(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
