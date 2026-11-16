import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck, Loader2, X } from 'lucide-react';
import type { OrderSubmissionPayload } from '../utils/order';
import { formatPaymentMethodLabel } from '../utils/payment';

interface OrderConfirmationModalProps {
  pendingOrder: OrderSubmissionPayload | null;
  isSubmitting: boolean;
  submitError: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function OrderConfirmationModal({
  pendingOrder,
  isSubmitting,
  submitError,
  onCancel,
  onConfirm,
}: OrderConfirmationModalProps) {
  useEffect(() => {
    if (!pendingOrder) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingOrder, isSubmitting, onCancel]);

  if (!pendingOrder) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1614]/65 backdrop-blur-sm p-4 sm:p-6"
      onClick={() => {
        if (!isSubmitting) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-confirm-modal-title"
        data-testid="order-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-[#E7E2DA] bg-[#FAF8F5] p-5 sm:p-6 shadow-[0_24px_60px_-16px_rgba(26,22,20,0.45)]"
      >
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onCancel}
          aria-label="Tutup konfirmasi pesanan"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E7E2DA] bg-white text-[#5E544E] transition-colors hover:bg-[#EFEAE2] hover:text-[#1A1614] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-3 pr-10">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#F39C12]/35 bg-[#FFF5EB] text-[#C2410C]">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A3412]">
              Verifikasi 2 Langkah
            </p>
            <h2
              id="order-confirm-modal-title"
              className="mt-1 font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold leading-snug text-[#1A1614] [text-wrap:balance]"
            >
              Apakah semua data yang kamu isi sudah sesuai?
            </h2>
            <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#5E544E]">
              Periksa kembali data pemesan, lokasi pengiriman, dan menu pilihanmu sebelum pesanan
              diproses.
            </p>
          </div>
        </div>

        <dl className="mt-4 rounded-xl border border-[#E7E2DA] bg-white p-4 text-sm space-y-2.5">
          <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-[#F0ECE6]">
            <dt className="text-[#786D65] shrink-0">Nama Lengkap</dt>
            <dd className="font-semibold text-right text-[#1A1614]">{pendingOrder.nama}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-[#F0ECE6]">
            <dt className="text-[#786D65] shrink-0">WhatsApp</dt>
            <dd className="font-mono text-right text-[#1A1614] tabular-nums">
              {pendingOrder.whatsapp}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-[#F0ECE6]">
            <dt className="text-[#786D65] shrink-0">Pengiriman</dt>
            <dd className="font-medium text-right text-[#1A1614]">{pendingOrder.pengiriman}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-[#F0ECE6]">
            <dt className="text-[#786D65] shrink-0">Lokasi / Alamat</dt>
            <dd className="font-medium text-right text-[#1A1614] max-w-[260px]">
              {pendingOrder.alamat}
            </dd>
          </div>
          {pendingOrder.catatan && (
            <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-[#F0ECE6]">
              <dt className="text-[#786D65] shrink-0">Catatan</dt>
              <dd className="text-right text-[#1A1614] max-w-[260px]">
                {pendingOrder.catatan}
              </dd>
            </div>
          )}
          <div className="flex items-start justify-between gap-4 pb-2.5 border-b border-[#F0ECE6]">
            <dt className="text-[#786D65] shrink-0">Metode Pembayaran</dt>
            <dd className="font-semibold text-right text-[#1A1614]">
              {formatPaymentMethodLabel(pendingOrder.metodePembayaran)}
            </dd>
          </div>
          <div className="pb-2.5 border-b border-[#F0ECE6]">
            <dt className="text-xs font-semibold uppercase tracking-wider text-[#786D65]">
              Menu Dipesan
            </dt>
            <dd className="mt-1 text-sm font-medium leading-relaxed text-[#1A1614]">
              {pendingOrder.pesanan}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 pt-0.5">
            <dt className="font-semibold text-[#1A1614]">Total</dt>
            <dd className="font-mono text-lg font-bold tabular-nums text-[#9A3412]">
              {pendingOrder.total}
            </dd>
          </div>
        </dl>

        {submitError && (
          <div
            role="alert"
            data-testid="confirm-modal-error-banner"
            className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-3 text-xs sm:text-sm text-[#991B1B]"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            data-testid="cancel-order-confirm-btn"
            className="inline-flex h-11 w-full sm:w-auto shrink-0 items-center justify-center rounded-lg border border-[#DDD6CC] bg-white px-4 text-sm font-semibold text-[#1A1614] transition-colors hover:bg-[#EFEAE2] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            Ubah Data
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            data-testid="confirm-order-submit-btn"
            className="inline-flex h-11 w-full sm:w-auto sm:flex-1 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#C2410C] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9A3412] disabled:opacity-65 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C] cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Mengirim pesanan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Ya, Sudah Sesuai &amp; Kirim</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
