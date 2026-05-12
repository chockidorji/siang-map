import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Village } from '../data/villages';

export type LabelPlacement = 'below' | 'above';

interface Props {
  village: Village;
  /**
   * Where to anchor the always-visible name chip relative to the pin.
   * Computed in the parent so dense clusters can stagger their labels
   * to reduce overlap.
   */
  placement?: LabelPlacement;
  onClick: (village: Village, event: L.LeafletMouseEvent) => void;
}

// Pin colour tracks the MoU agreement rate. Same thresholds the drawer's
// progress bar uses (`pctTone` in VillageTooltip) so the two stay in sync.
//   ≥ 80%  → emerald-600  (success)
//   ≥ 40%  → orange-500   (in progress)
//   <  40% → red-600      (low)
//   null   → gray-500     (data inconsistent — Angging/Singging/Resing)
function pinColour(village: Village): string {
  const pct = village.mou.percentAgreed;
  if (pct === null) return '#6B7280';
  if (pct >= 80)    return '#059669';
  if (pct >= 40)    return '#F97316';
  return '#DC2626';
}

function ariaLabel(v: Village): string {
  const pct =
    v.mou.percentAgreed === null
      ? 'percent agreed not available'
      : `${v.mou.percentAgreed.toFixed(1)} percent agreed`;
  const approx = v.isApproximate ? ', approximate location' : '';
  return `${v.name}, MoU signed ${v.mou.signedOn}, ${v.mou.households} households, ${pct}${approx}. Press Enter for details.`;
}

const PIN_W = 22;
const PIN_H = 30;

function buildIcon(village: Village, placement: LabelPlacement): L.DivIcon {
  const is100 = village.mou.percentAgreed === 100;
  const colour = pinColour(village);
  const approx = village.isApproximate;

  // SVG map-pin (teardrop). 24×32 viewBox; tip at (12, 32). Material-style.
  // Verified  : solid fill, white inner dot, soft drop-shadow.
  // Approximate: white fill, dashed stroke in the village colour, inner dot
  //              also in the colour — keeps the "this is an estimate" visual
  //              language that the old dashed ring established.
  const pinSvg = approx
    ? `
      <svg width="${PIN_W}" height="${PIN_H}" viewBox="0 0 24 32" style="display:block;">
        <path d="M12 1 C5.9 1 1 5.9 1 12 c0 8.3 11 19 11 19 s11-10.7 11-19 c0-6.1-4.9-11-11-11 z"
              fill="white" stroke="${colour}" stroke-width="1.8" stroke-dasharray="3 2"/>
        <circle cx="12" cy="12" r="3" fill="${colour}"/>
      </svg>`
    : `
      <svg width="${PIN_W}" height="${PIN_H}" viewBox="0 0 24 32"
           style="display:block; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,0.35));">
        <path d="M12 1 C5.9 1 1 5.9 1 12 c0 8.3 11 19 11 19 s11-10.7 11-19 c0-6.1-4.9-11-11-11 z"
              fill="${colour}" stroke="white" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="3.4" fill="white"/>
      </svg>`;

  const star = is100
    ? '<span class="absolute -top-1 -right-1 text-amber-500 text-[13px] leading-none" style="text-shadow: 0 0 2px white, 0 0 2px white;">★</span>'
    : '';

  // Anchor chip just outside the pin: 2px clear of the bottom tip ('below')
  // or top of the teardrop ('above'). Values hardcoded because Tailwind
  // can't see interpolated class strings.
  const chipPos =
    placement === 'above'
      ? 'left-1/2 bottom-[32px] -translate-x-1/2'
      : 'left-1/2 top-[32px] -translate-x-1/2';

  return L.divIcon({
    className: '',
    iconSize: [PIN_W, PIN_H],
    iconAnchor: [PIN_W / 2, PIN_H], // bottom-center = pin tip = actual lat/lng
    html: `
      <div class="relative" style="width:${PIN_W}px;height:${PIN_H}px;" role="img" aria-label="${ariaLabel(village).replace(/"/g, '&quot;')}">
        ${pinSvg}
        ${star}
        <div class="village-chip absolute ${chipPos} pointer-events-none whitespace-nowrap
                    rounded-md bg-white/95 px-1.5 py-[1px] text-[10px] font-medium
                    text-gray-900 border border-gray-200
                    shadow-[0_1px_2px_rgba(255,255,255,1),0_2px_4px_rgba(0,0,0,0.15)]">
          ${village.name}
        </div>
      </div>
    `,
  });
}

export default function VillagePin({ village, placement = 'below', onClick }: Props) {
  return (
    <Marker
      position={[village.lat, village.lng]}
      icon={buildIcon(village, placement)}
      // Leaflet's `keyboard` option (default true) makes the marker focusable
      // and converts Enter/Space into a click event, so wiring `click` is
      // enough to get keyboard activation for free.
      keyboard
      title={ariaLabel(village)}
      alt={ariaLabel(village)}
      eventHandlers={{
        click: (e) => onClick(village, e),
      }}
    />
  );
}
