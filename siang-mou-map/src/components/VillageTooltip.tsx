import { useLayoutEffect, useRef, useState } from 'react';
import type { Village } from '../data/villages';

interface Props {
  village: Village;
  /** Pixel position of the pin, relative to the map container */
  x: number;
  y: number;
  /** Map container size, used to clamp/flip the card so it stays on screen */
  containerW: number;
  containerH: number;
  /**
   * `hover` follows the cursor and dismisses on mouse-out.
   * `pinned` was opened by click/keyboard and stays until dismissed —
   * we render a close button + ESC hint in that mode.
   */
  source: 'hover' | 'pinned';
  /** Called when the user dismisses a pinned card (X button or backdrop click) */
  onDismiss?: () => void;
}

const GAP = 14;
const EDGE = 8;

/**
 * Resolve where to place the card given the pin position and the card's own
 * measured size. Prefers top-right of the pin; flips horizontally if it would
 * clip the right edge, clamps vertically if it would clip top/bottom.
 */
function resolvePlacement(
  pinX: number,
  pinY: number,
  cardW: number,
  cardH: number,
  containerW: number,
  containerH: number,
) {
  let x = pinX + GAP;
  // Flip to the left of the pin if the card would clip the right edge.
  if (x + cardW > containerW - EDGE) {
    x = pinX - GAP - cardW;
  }
  // If it still doesn't fit on the left, clamp inside the viewport.
  x = Math.max(EDGE, Math.min(x, containerW - cardW - EDGE));

  // Default: card top sits 90px above the pin (so the pin is near the card's bottom-left).
  let y = pinY - 90;
  // Clamp vertically.
  y = Math.max(EDGE, Math.min(y, containerH - cardH - EDGE));
  return { x, y };
}

export default function VillageTooltip({
  village,
  x: pinX,
  y: pinY,
  containerW,
  containerH,
  source,
  onDismiss,
}: Props) {
  const { mou } = village;
  const cardRef = useRef<HTMLDivElement | null>(null);
  // Start with conservative defaults so the first paint isn't off-screen,
  // then refine once we've measured the card.
  const [pos, setPos] = useState({ x: pinX + GAP, y: pinY - 90 });

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPos(resolvePlacement(pinX, pinY, rect.width, rect.height, containerW, containerH));
  }, [pinX, pinY, containerW, containerH, village.id, source]);

  const isPinned = source === 'pinned';

  return (
    <div
      ref={cardRef}
      role="tooltip"
      aria-live="polite"
      className={
        // pointer events are off for the hover card (it shouldn't steal events
        // from underlying pins) but ON for the pinned card so the close button
        // is usable.
        (isPinned ? 'pointer-events-auto ' : 'pointer-events-none ') +
        'absolute left-0 top-0 z-[1000] w-[300px] animate-[fadeIn_150ms_ease-out]'
      }
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      <div className="relative rounded-sm border-[1.5px] border-black bg-white p-4 shadow-md">
        {isPinned && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close MoU status card"
            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center
                       rounded text-[14px] leading-none text-gray-500 hover:bg-gray-100
                       hover:text-gray-900 focus-visible:outline focus-visible:outline-2
                       focus-visible:outline-offset-1 focus-visible:outline-blue-600"
          >
            ×
          </button>
        )}
        <h3 className="mb-3 text-center text-[16px] font-bold text-gray-900">
          {village.name}
        </h3>
        <dl className="space-y-2 text-[13px] text-gray-900">
          <div className="flex items-baseline justify-between gap-4">
            <dt>MoU signed on</dt>
            <dd className="text-right">{mou.signedOn}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt>No. of Households</dt>
            <dd>{mou.households}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt>No. of Households agreed for PFR</dt>
            <dd>{mou.agreedForPFR}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4 px-4 text-[14px] font-bold text-gray-900">
        <span>% of Households Agreed for PFR</span>
        <span>{mou.percentAgreed === null ? '—' : `${mou.percentAgreed.toFixed(1)}%`}</span>
      </div>
      {village.isApproximate && (
        <p className="mt-1 px-4 text-[10px] italic text-gray-500">Location approximated</p>
      )}
      {isPinned && (
        <p className="mt-1 px-4 text-[10px] text-gray-400">Press Esc or click ✕ to close</p>
      )}
    </div>
  );
}
