import { useEffect } from 'react';
import { CheckCircle2, Coffee, Heart, X } from 'lucide-react';
import type { OrderSubmissionPayload } from '../utils/order';
import { formatPaymentMethodLabel } from '../utils/payment';

interface OrderSuccessModalProps {
  receipt: OrderSubmissionPayload | null;
  isOpen: boolean;
  onClose: () => void;
  onStartNewOrder: () => void;
}

export function OrderSuccessModal({
  receipt,
  isOpen,
  onClose,
  onStartNewOrder,
}: OrderSuccessModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !receipt) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1614]/65 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-success-modal-title"
        data-testid="order-success-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-[#E7E2DA] bg-[#FAF8F5] p-5 sm:p-6 shadow-[0_24px_60px_-16px_rgba(26,22,20,0.45)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup notifikasi pesanan berhasil"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E7E2DA] bg-white text-[#5E544E] transition-colors hover:bg-[#EFEAE2] hover:text-[#1A1614] cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF5EB] border border-[#F39C12]/35 text-[#C2410C]">
            <Coffee className="h-8 w-8" strokeWidth={1.75} aria-hidden="true" />
            <span className="absolute -right-1.5 -bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#15803D] text-white shadow-sm">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>

          <p className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#15803D]">
            <Heart className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            <span>Pesanan Berhasil Terkirim</span>
          </p>

          <h2
            id="order-success-modal-title"
            className="mt-1.5 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold leading-tight text-[#1A1614] [text-wrap:balance]"
          >
            Terimakasih ya sayang!
          </h2>

          <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-[#5E544E]">
            Pesanan atas nama <span className="font-semibold text-[#1A1614]">{receipt.nama}</span>{' '}
            sudah masuk ke antrean Kopi D&apos;SHYT dan siap kami racik.
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-[#E7E2DA] bg-white p-3.5 sm:p-4 text-sm">
          <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-[#F0ECE6]">
            <span className="text-[#786D65] shrink-0">Menu</span>
            <span className="font-medium text-right text-[#1A1614]">{receipt.pesanan}</span>
          </div>
          <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#F0ECE6]">
            <span className="text-[#786D65] shrink-0">Pengiriman</span>
            <span className="font-medium text-right text-[#1A1614]">
              {receipt.pengiriman} · {receipt.alamat}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#F0ECE6]">
            <span className="text-[#786D65] shrink-0">Pembayaran</span>
            <span className="font-semibold text-right text-[#1A1614]">
              {formatPaymentMethodLabel(receipt.metodePembayaran)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-2.5">
            <span className="font-semibold text-[#1A1614]">Total</span>
            <span className="font-mono text-lg font-bold tabular-nums text-[#9A3412]">
              {receipt.total}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-full sm:w-auto sm:flex-1 shrink-0 items-center justify-center rounded-lg bg-[#C2410C] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] cursor-pointer"
          >
            Tutup &amp; Lihat Struk
          </button>
          <button
            type="button"
            onClick={onStartNewOrder}
            className="inline-flex h-11 w-full sm:w-auto shrink-0 items-center justify-center rounded-lg border border-[#DDD6CC] bg-white px-5 text-sm font-semibold text-[#1A1614] transition-colors hover:bg-[#EFEAE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] cursor-pointer"
          >
            Pesan Lagi
          </button>
        </div>
      </div>
    </div>
  );
}
