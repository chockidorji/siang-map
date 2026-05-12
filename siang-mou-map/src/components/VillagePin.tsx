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
const PIN_H = 32;
const STICK_COLOUR = '#475569'; // slate-600 — the needle/stem of the push-pin

function buildIcon(village: Village, placement: LabelPlacement): L.DivIcon {
  const is100 = village.mou.percentAgreed === 100;
  const colour = pinColour(village);
  const approx = village.isApproximate;

  // Push-pin marker: round head (the "ball") on top of a thin slate stem,
  // tip of the stem sits at the actual lat/lng.
  //
  // 22×32 viewBox layout:
  //   - ball     : circle (cx 11, cy 11, r 10)
  //   - highlight: small lighter spot at (7, 7) — gives the head a glossy
  //                feel and matches the reference marker.
  //   - stem     : 2px-wide line from (11, 21) to (11, 31).
  //
  // Verified pins use a solid ball with the highlight; approximate pins
  // get a hollow ball with a dashed stroke in the village colour plus a
  // small inner dot, so the "this is an estimate" language is preserved.
  const ball = approx
    ? `<circle cx="11" cy="11" r="10" fill="white" stroke="${colour}" stroke-width="1.8" stroke-dasharray="3 2"/>
       <circle cx="11" cy="11" r="3.2" fill="${colour}"/>`
    : `<circle cx="11" cy="11" r="10" fill="${colour}"/>
       <ellipse cx="7" cy="7" rx="2.6" ry="1.8" fill="white" opacity="0.42"/>`;

  const pinSvg = `
    <svg width="${PIN_W}" height="${PIN_H}" viewBox="0 0 22 32"
         style="display:block; filter: drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.35));">
      <line x1="11" y1="21" x2="11" y2="31" stroke="${STICK_COLOUR}" stroke-width="2" stroke-linecap="round"/>
      ${ball}
    </svg>`;

  const star = is100
    ? '<span class="absolute -top-1 -right-1 text-amber-500 text-[13px] leading-none" style="text-shadow: 0 0 2px white, 0 0 2px white;">★</span>'
    : '';

  // Chip clears the icon by 2px ('below' = under the stem tip, 'above' =
  // above the ball). Hardcoded so Tailwind's JIT can see the class.
  const chipPos =
    placement === 'above'
      ? 'left-1/2 bottom-[34px] -translate-x-1/2'
      : 'left-1/2 top-[34px] -translate-x-1/2';

  return L.divIcon({
    className: '',
    iconSize: [PIN_W, PIN_H],
    iconAnchor: [PIN_W / 2, PIN_H], // bottom-center = stem tip = actual lat/lng
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
