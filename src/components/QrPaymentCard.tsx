import { useState } from 'react';
import { Check, Copy, Download, QrCode } from 'lucide-react';

export const MERCHANT_QR_IMAGE_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-15_at_01.22.35__1__95027c35.jpeg';

interface QrPaymentCardProps {
  formattedAmount: string;
  reference: string;
  compact?: boolean;
}

export function QrPaymentCard({
  formattedAmount,
  reference,
  compact = false,
}: QrPaymentCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyReference() {
    try {
      await navigator.clipboard?.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable in restricted contexts; ignore silently.
    }
  }

  return (
    <div
      data-testid="qr-payment-card"
      className={`rounded-xl border border-[#E7E2DA] bg-[#FAF8F5] ${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      }`}
    >
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E7E2DA]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1A1614] text-white">
            <QrCode className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#1A1614]">
              QRIS · Kopi D&apos;SHYT
            </p>
            <p className="font-mono text-[11px] text-[#786D65] truncate">{reference}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyReference}
          aria-label={`Salin kode referensi ${reference}`}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-[#DDD6CC] bg-white px-2.5 text-[11px] font-semibold text-[#1A1614] transition-colors hover:bg-[#EFEAE2] whitespace-nowrap shrink-0 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-[#15803D]" aria-hidden="true" />
              <span className="text-[#15803D]">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" aria-hidden="true" />
              <span>Salin Ref</span>
            </>
          )}
        </button>
      </div>

      <div className={`${compact ? 'mt-2.5' : 'mt-3.5'} flex flex-col items-center text-center`}>
        <div className="rounded-xl border border-[#E7E2DA] bg-white p-2.5 shadow-xs">
          <img
            src={MERCHANT_QR_IMAGE_URL}
            alt={`Kode QR pembayaran Kopi D'SHYT sebesar ${formattedAmount}`}
            data-testid="qr-code-image"
            className={compact ? 'h-40 w-40 object-contain' : 'h-48 w-48 object-contain'}
          />
        </div>

        <div className={compact ? 'mt-2' : 'mt-3'}>
          <p className="text-[11px] uppercase tracking-wider text-[#786D65]">Nominal Pembayaran</p>
          <p
            data-testid="qr-amount-text"
            className="font-mono text-lg font-bold tabular-nums text-[#9A3412]"
          >
            {formattedAmount}
          </p>
        </div>

        <p className="mt-1 text-xs leading-relaxed text-[#5E544E] max-w-[34ch]">
          Scan QRIS di atas sebesar{' '}
          <span className="font-semibold text-[#1A1614]">{formattedAmount}</span> menggunakan
          GoPay, OVO, DANA, ShopeePay, atau Mobile Banking.
        </p>

        <a
          href={MERCHANT_QR_IMAGE_URL}
          download="QRIS-Kopi-DSHYT.jpeg"
          className="mt-2.5 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#DDD6CC] bg-white px-3.5 text-xs font-semibold text-[#1A1614] transition-colors hover:bg-[#EFEAE2] whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Unduh Gambar QR</span>
        </a>
      </div>
    </div>
  );
}
