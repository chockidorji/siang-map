import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Village } from '../data/villages';

export type LabelPlacement = 'below' | 'above' | 'right' | 'left';

interface Props {
  village: Village;
  /**
   * Where to anchor the always-visible name chip relative to the pin.
   * Computed in the parent so dense clusters can stagger their labels
   * to reduce overlap.
   */
  placement?: LabelPlacement;
  /** If true, draw a dashed ring around the pin head. Set when this is the
   *  currently selected village in the sidebar / detail panel. */
  selected?: boolean;
  onClick: (village: Village, event: L.LeafletMouseEvent) => void;
}

// Pin colour tracks the MoU agreement rate using the Atlas earth-tone
// palette (moss / ochre / brick / stone) instead of the bright stoplight.
//   ≥ 80%  → moss   (high)
//   ≥ 40%  → ochre  (mid)
//   <  40% → brick  (low)
//   null   → stone  (data inconsistent / no MoU)
function pinColour(village: Village): string {
  const pct = village.mou.percentAgreed;
  if (pct === null) return '#8a857d';
  if (pct >= 80)    return '#3a6b4a';
  if (pct >= 40)    return '#b07d35';
  return '#a94228';
}

function ariaLabel(v: Village): string {
  const pct =
    v.mou.percentAgreed === null
      ? 'percent agreed not available'
      : `${v.mou.percentAgreed.toFixed(1)} percent agreed`;
  const approx = v.isApproximate ? ', approximate location' : '';
  return `${v.name}, MoU signed ${v.mou.signedOn}, ${v.mou.households} households, ${pct}${approx}. Press Enter for details.`;
}

const PIN_W = 14;
const PIN_H = 22;
const STICK_COLOUR = '#475569'; // slate-600 — the needle/stem of the push-pin

function buildIcon(village: Village, placement: LabelPlacement, selected: boolean): L.DivIcon {
  const is100 = village.mou.percentAgreed === 100;
  const colour = pinColour(village);
  const approx = village.isApproximate;

  // Push-pin marker: round head ("ball") on top of a thin slate stem; the
  // stem tip sits at the actual lat/lng. Head radius halved from the prior
  // pass per request — overall icon shrunk to 14×22.
  //
  // 14×22 viewBox layout:
  //   - ball     : circle (cx 7, cy 6, r 5)        — 10px diameter
  //   - highlight: small lighter spot at (5, 4)    — glossy feel
  //   - stem     : 1.5px-wide line from (7, 11) to (7, 21)
  //
  // Approximate pins use a hollow head with a dashed colour stroke + a
  // small inner dot in the village colour, preserving the existing
  // "this is an estimate" cue.
  const ball = approx
    ? `<circle cx="7" cy="6" r="5" fill="white" stroke="${colour}" stroke-width="1.4" stroke-dasharray="2 1.5"/>
       <circle cx="7" cy="6" r="1.6" fill="${colour}"/>`
    : `<circle cx="7" cy="6" r="5" fill="${colour}"/>
       <ellipse cx="5" cy="4" rx="1.5" ry="1" fill="white" opacity="0.42"/>`;

  // Selected ring: solid coloured ring in the village's own PFR colour, with
  // a soft halo behind it so the active pin reads clearly even when it sits
  // inside a cluster. Drawn before the pin so the ball + stem still paint
  // on top.
  const selectedRing = selected
    ? `<circle cx="7" cy="6" r="10.5" fill="${colour}" opacity="0.16"/>
       <circle cx="7" cy="6" r="8.5"  fill="none" stroke="${colour}" stroke-width="1.6"/>`
    : '';

  const pinSvg = `
    <svg width="${PIN_W}" height="${PIN_H}" viewBox="0 0 14 22"
         style="display:block; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.35)); overflow:visible;">
      ${selectedRing}
      <line x1="7" y1="11" x2="7" y2="21" stroke="${STICK_COLOUR}" stroke-width="1.5" stroke-linecap="round"/>
      ${ball}
    </svg>`;

  const star = is100
    ? '<span class="absolute -top-[3px] -right-[3px] text-amber-500 text-[10px] leading-none" style="text-shadow: 0 0 2px white, 0 0 2px white;">★</span>'
    : '';

  // Chip clears the icon by ~4 px so it doesn't touch the pin head/stem.
  // Hardcoded class strings so Tailwind's JIT picks them up.
  //   below : default — under the stem tip
  //   above : above the head
  //   right : to the right of the head, vertically centred on the ball
  //   left  : to the left of the head, vertically centred on the ball
  const chipPos = {
    above: 'left-1/2 bottom-[24px] -translate-x-1/2',
    below: 'left-1/2 top-[24px] -translate-x-1/2',
    right: 'left-[18px] top-[6px] -translate-y-1/2',
    left:  'right-[18px] top-[6px] -translate-y-1/2',
  }[placement];

  return L.divIcon({
    className: '',
    iconSize: [PIN_W, PIN_H],
    iconAnchor: [PIN_W / 2, PIN_H], // bottom-center = stem tip = actual lat/lng
    html: `
      <div class="relative" style="width:${PIN_W}px;height:${PIN_H}px;" role="img" aria-label="${ariaLabel(village).replace(/"/g, '&quot;')}">
        ${pinSvg}
        ${star}
        <div class="village-chip absolute ${chipPos} pointer-events-none whitespace-nowrap
                    px-1.5 py-[1px] text-[11px]"
             style="font-family: var(--font-serif); font-weight: ${selected ? 600 : 500};
                    color: var(--ink); background: rgba(255,255,255,0.92);
                    border: 0.5px solid var(--hairline-soft); letter-spacing: 0.005em;
                    text-shadow: 0 0 2px #ffffff, 0 0 2px #ffffff;">
          ${village.name}
        </div>
      </div>
    `,
  });
}

export default function VillagePin({ village, placement = 'below', selected = false, onClick }: Props) {
  return (
    <Marker
      position={[village.lat, village.lng]}
      icon={buildIcon(village, placement, selected)}
      // Leaflet's `keyboard` option (default true) makes the marker focusable
      // and converts Enter/Space into a click event, so wiring `click` is
      // enough to get keyboard activation for free.
      keyboard
      title={ariaLabel(village)}
      alt={ariaLabel(village)}
      // The selected village floats above every other marker and label so it
      // never gets hidden under a neighbour in dense clusters.
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{
        click: (e) => onClick(village, e),
      }}
    />
  );
}
