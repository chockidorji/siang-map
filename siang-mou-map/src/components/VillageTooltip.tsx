import type { Village } from '../data/villages';

interface Props {
  village: Village;
  /**
   * `hover` follows the cursor and dismisses on mouse-out.
   * `pinned` was opened by click/keyboard and stays until dismissed —
   * we render a close button + ESC hint in that mode.
   */
  source: 'hover' | 'pinned';
  /** Called when the user dismisses a pinned card (X button) */
  onDismiss?: () => void;
}

/**
 * Right-edge MoU status drawer. Slides in from the right on mount; content
 * updates in place if the user moves between pins (no re-slide). Pinned
 * mode adds a close button + Esc hint.
 *
 * Layout intentionally mirrors the dhpdap.online side-panel pattern:
 * gradient header with village name + signing date, then a 2-up stat
 * card row (Households / Agreed for PFR), then a horizontal progress
 * bar for the percent value.
 */
function pctColor(pct: number): { bar: string; text: string } {
  if (pct >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-700' };
  if (pct >= 50) return { bar: 'bg-amber-500',   text: 'text-amber-700' };
  return { bar: 'bg-red-500', text: 'text-red-700' };
}

export default function VillageTooltip({ village, source, onDismiss }: Props) {
  const { mou } = village;
  const percent = mou.percentAgreed;
  const isPinned = source === 'pinned';
  const tone = percent !== null ? pctColor(percent) : null;

  return (
    <div
      role="tooltip"
      aria-live="polite"
      className={
        'pointer-events-auto absolute right-0 top-0 bottom-0 z-[1000] w-[360px] ' +
        'animate-[slideInRight_280ms_ease-out]'
      }
    >
      <div className="flex h-full flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl">
        {/* Header — gradient blue, matches the dhpdap.online drawer */}
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 px-6 py-5 text-white">
          {isPinned && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Close MoU status card"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center
                         rounded text-[20px] font-light leading-none text-white/85
                         hover:bg-white/15 hover:text-white
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              ×
            </button>
          )}
          <h3 className="text-[22px] font-bold leading-tight tracking-tight">
            {village.name}
          </h3>
          <p className="mt-1 text-sm text-white/90">
            MoU signed on <span className="font-semibold">{mou.signedOn}</span>
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 2-up stat cards (Households / Agreed for PFR) */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                Households
              </div>
              <div className="mt-1 text-[28px] font-bold leading-none text-blue-900">
                {mou.households}
              </div>
              <div className="mt-1 text-[11px] text-blue-700">Total</div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                Agreed for PFR
              </div>
              <div className="mt-1 text-[28px] font-bold leading-none text-emerald-900">
                {mou.agreedForPFR}
              </div>
              <div className="mt-1 text-[11px] text-emerald-700">Households</div>
            </div>
          </div>

          {/* Percent — progress bar in the dhpdap "Capacity Distribution" style */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              % of Households Agreed for PFR
            </h4>
            {percent !== null && tone ? (
              <>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full rounded-full ${tone.bar} transition-[width] duration-300`}
                    style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                  />
                </div>
                <div className="mt-2 flex items-baseline justify-between text-[11px]">
                  <span className="text-gray-500">0%</span>
                  <span className={`text-[18px] font-bold leading-none ${tone.text}`}>
                    {percent.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">100%</span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm italic text-gray-500">
                Source data inconsistent — percentage unavailable.
              </p>
            )}
          </div>

          {village.isApproximate && (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-[11px] text-amber-800">
                <span className="font-semibold">Note:</span> Pin location is
                approximate (eyeballed from reference map).
              </p>
            </div>
          )}
        </div>

        {/* Footer hint (pinned only) */}
        {isPinned && (
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-2.5 text-[11px] text-gray-500">
            Press{' '}
            <kbd className="rounded border border-gray-300 bg-white px-1 py-[1px] font-mono text-[10px]">
              Esc
            </kbd>{' '}
            or click{' '}
            <kbd className="rounded border border-gray-300 bg-white px-1 py-[1px] font-mono text-[10px]">
              ✕
            </kbd>{' '}
            to close
          </div>
        )}
      </div>
    </div>
  );
}
