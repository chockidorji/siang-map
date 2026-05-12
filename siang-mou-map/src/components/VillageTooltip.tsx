import type { Village } from '../data/villages';

interface Props {
  village: Village;
  onDismiss: () => void;
}

function pctTone(pct: number): { bar: string; text: string } {
  if (pct >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600' };
  if (pct >= 50) return { bar: 'bg-amber-500',   text: 'text-amber-600' };
  return { bar: 'bg-red-500', text: 'text-red-600' };
}

/**
 * Right-edge MoU status drawer. Opens only on pin click (no hover). Slides
 * in from off-screen-right on mount. Intentionally minimal styling: white
 * background, hairline dividers, no gradients, color reserved for the
 * agreement-rate accent.
 */
export default function VillageTooltip({ village, onDismiss }: Props) {
  const { mou } = village;
  const pct = mou.percentAgreed;
  const tone = pct !== null ? pctTone(pct) : null;

  return (
    <div
      role="dialog"
      aria-label={`${village.name} MoU status`}
      className="pointer-events-auto absolute right-0 top-0 bottom-0 z-[1000] flex w-[340px]
                 flex-col border-l border-gray-200 bg-white shadow-lg
                 animate-[slideInRight_240ms_ease-out]"
    >
      {/* Header — light, minimal */}
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 pb-4 pt-5">
        <div className="min-w-0">
          <h3 className="truncate text-[18px] font-semibold tracking-tight text-gray-900">
            {village.name}
          </h3>
          <p className="mt-1 text-[12px] text-gray-500">
            MoU signed · {mou.signedOn}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Close MoU status card"
          className="-mr-2 -mt-1 flex h-7 w-7 items-center justify-center rounded text-[20px]
                     leading-none text-gray-400 transition-colors hover:bg-gray-100
                     hover:text-gray-900 focus-visible:outline focus-visible:outline-2
                     focus-visible:outline-offset-1 focus-visible:outline-blue-600"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 px-6 py-5">
        {/* Stats — typography-first, no chip backgrounds */}
        <div className="grid grid-cols-2 gap-x-6">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Households
            </div>
            <div className="mt-1 text-[26px] font-semibold leading-none tabular-nums text-gray-900">
              {mou.households}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Agreed for PFR
            </div>
            <div className="mt-1 text-[26px] font-semibold leading-none tabular-nums text-gray-900">
              {mou.agreedForPFR}
            </div>
          </div>
        </div>

        {/* Agreement rate */}
        <div className="border-t border-gray-100 pt-4">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Agreement Rate
            </span>
            {pct !== null && tone && (
              <span className={`text-[16px] font-semibold tabular-nums ${tone.text}`}>
                {pct.toFixed(1)}%
              </span>
            )}
          </div>
          {pct !== null && tone ? (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full ${tone.bar} transition-[width] duration-300`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          ) : (
            <p className="text-[13px] italic text-gray-400">
              Source data inconsistent — percentage unavailable
            </p>
          )}
        </div>

        {village.isApproximate && (
          <p className="text-[11px] text-gray-400">
            <span className="font-medium text-gray-500">Note:</span> Pin location is approximate.
          </p>
        )}
      </div>

      {/* Footer — keyboard hint */}
      <div className="border-t border-gray-100 px-6 py-2.5 text-[11px] text-gray-400">
        Press{' '}
        <kbd className="rounded border border-gray-200 bg-gray-50 px-1 py-[1px] font-mono text-[10px] text-gray-500">
          Esc
        </kbd>{' '}
        to close
      </div>
    </div>
  );
}
