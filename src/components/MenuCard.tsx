import { useState } from 'react';
import { Coffee, Minus, Plus } from 'lucide-react';
import type { MenuItem } from '../data/menu';
import { FALLBACK_IMAGES } from '../data/fallbackImages';
import { formatRupiah } from '../utils/order';

const failedPrimaryUrls = new Set<string>();

interface MenuCardProps {
  item: MenuItem;
  quantity: number;
  onOpenCustomize: (item: MenuItem) => void;
  onDecrementItem: (item: MenuItem) => void;
}

export function MenuCard({
  item,
  quantity,
  onOpenCustomize,
  onDecrementItem,
}: MenuCardProps) {
  const [imageStage, setImageStage] = useState<'primary' | 'fallback' | 'icon'>(() =>
    failedPrimaryUrls.has(item.imageUrl) ? 'fallback' : 'primary'
  );

  const activeImageSrc =
    imageStage === 'primary' ? item.imageUrl : FALLBACK_IMAGES[item.fallbackKey];

  return (
    <article
      data-testid={`menu-card-${item.id}`}
      className={`group flex flex-col bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
        quantity > 0
          ? 'border-[#C2410C]/50 shadow-[0_6px_24px_-6px_rgba(194,65,12,0.14)]'
          : 'border-[#E7E2DA] hover:border-[#D4CCC0] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(26,22,20,0.08)]'
      }`}
    >
      <div className="relative aspect-[2/3] w-full bg-[#F3EFE9] overflow-hidden">
        {imageStage !== 'icon' ? (
          <img
            src={activeImageSrc}
            alt={item.name}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => {
              if (imageStage === 'primary') {
                failedPrimaryUrls.add(item.imageUrl);
                setImageStage('fallback');
              } else {
                setImageStage('icon');
              }
            }}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#F3EFE9] to-[#E9E2D8] px-4 text-center">
            <Coffee className="h-8 w-8 text-[#9A3412]/70" strokeWidth={1.5} aria-hidden="true" />
            <span className="text-xs font-medium text-[#6B5F57]">{item.name}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#786D65]">
            {item.category}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-[#1A1614]">
            {item.name}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#5E544E] line-clamp-2">
            {item.note}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-[#F0ECE6]">
          <span className="font-mono text-sm sm:text-[15px] font-semibold tabular-nums text-[#9A3412] whitespace-nowrap shrink-0">
            {formatRupiah(item.price)}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {quantity > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => onDecrementItem(item)}
                  aria-label={`Kurangi ${item.name}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2DCD3] bg-[#FAF8F5] text-[#1A1614] transition-colors hover:bg-[#EFEAE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] cursor-pointer"
                >
                  <Minus className="h-4 w-4" aria-hidden="true" />
                </button>
                <span
                  aria-label={`Jumlah ${item.name}`}
                  data-testid={`qty-${item.id}`}
                  className="w-5 text-center font-mono text-sm font-semibold tabular-nums text-[#1A1614]"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenCustomize(item)}
                  aria-label={`Tambah ${item.name}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#C2410C] text-white transition-colors hover:bg-[#9A3412] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onOpenCustomize(item)}
                aria-label={`Tambah ${item.name}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#1A1614] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#C2410C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Tambah</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
