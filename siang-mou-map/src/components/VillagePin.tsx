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

// Pin colour tracks the MoU agreement rate. Vibrant palette so the
// pins read clearly against the white sheet:
//   ≥ 80%  → emerald (high)
//   ≥ 40%  → vivid orange (mid)
//   <  40% → signal red (low)
//   null   → slate (data inconsistent / no MoU)
// Keep in sync with the --status-*-fill CSS variables in index.css.
function pinColour(village: Village): string {
  const pct = village.mou.percentAgreed;
  if (pct === null) return '#64748b';
  if (pct >= 80)    return '#059669';
  if (pct >= 40)    return '#ea580c';
  return '#dc2626';
}

// Darker companion stroke for the teardrop outline.
function pinStroke(village: Village): string {
  const pct = village.mou.percentAgreed;
  if (pct === null) return '#1e293b';
  if (pct >= 80)    return '#065f46';
  if (pct >= 40)    return '#9a3412';
  return '#7f1d1d';
}

function ariaLabel(v: Village): string {
  const pct =
    v.mou.percentAgreed === null
      ? 'percent agreed not available'
      : `${v.mou.percentAgreed.toFixed(1)} percent agreed`;
  const approx = v.isApproximate ? ', approximate location' : '';
  return `${v.name}, MoU signed ${v.mou.signedOn}, ${v.mou.households} households, ${pct}${approx}. Press Enter for details.`;
}

const PIN_W = 20;
const PIN_H = 24;

function buildIcon(village: Village, placement: LabelPlacement, selected: boolean): L.DivIcon {
  // Star fires for >=100% — covers the three Upper Siang villages whose
  // recorded agreed-count exceeds the household count (Angging 150%,
  // Singging 119%, Resing 125%), not just clean 100% cases.
  const is100 = (village.mou.percentAgreed ?? 0) >= 100;
  const colour = pinColour(village);
  const stroke = pinStroke(village);
  const approx = village.isApproximate;

  // Classic teardrop / Google-Maps-style pin. Round head with a white hole
  // at its centre, body tapers to a point at (10, 24). The point sits
  // exactly on the lat/lng via iconAnchor below.
  //
  // 20×24 viewBox layout:
  //   - body: teardrop path centred at head (10, 9), tip at (10, 24)
  //   - hole: white circle at (10, 9), r = 3.2
  //
  // Approximate pins use a hollow body with a dashed colour stroke + a
  // smaller inner dot in the village colour, preserving the "this is an
  // estimate" cue.
  const BODY_D =
    'M 10 1 C 5.03 1 1 5.03 1 10 C 1 16.6 10 24 10 24 ' +
    'C 10 24 19 16.6 19 10 C 19 5.03 14.97 1 10 1 Z';

  const body = approx
    ? `<path d="${BODY_D}" fill="white" stroke="${colour}" stroke-width="1.6" stroke-dasharray="2 1.6"/>
       <circle cx="10" cy="9.2" r="2.4" fill="${colour}"/>`
    : `<path d="${BODY_D}" fill="${colour}" stroke="${stroke}" stroke-width="0.8"/>
       <circle cx="10" cy="9.2" r="3.2" fill="white"/>`;

  // Selected: soft halo + solid ring in the village's own PFR colour so
  // the active pin reads clearly even inside a tight cluster.
  const selectedRing = selected
    ? `<circle cx="10" cy="9.2" r="12.5" fill="${colour}" opacity="0.16"/>
       <circle cx="10" cy="9.2" r="10.5" fill="none" stroke="${colour}" stroke-width="1.7"/>`
    : '';

  const pinSvg = `
    <svg width="${PIN_W}" height="${PIN_H}" viewBox="0 0 ${PIN_W} ${PIN_H}"
         style="display:block; filter: drop-shadow(0 1.5px 1.2px rgba(0,0,0,0.32)); overflow:visible;">
      ${selectedRing}
      ${body}
    </svg>`;

  const star = is100
    ? '<span class="absolute top-[1px] right-[1px] text-amber-500 text-[10px] leading-none" style="text-shadow: 0 0 2px white, 0 0 2px white;">★</span>'
    : '';

  // Chip clears the icon by ~4 px so it doesn't touch the pin body.
  // Positions reference the new 20×24 teardrop:
  //   - head centred at y=9
  //   - tip at y=24 (= iconAnchor)
  //   - body extends x = 1..19
  const chipPos = {
    above: 'left-1/2 bottom-[26px] -translate-x-1/2',
    below: 'left-1/2 top-[26px] -translate-x-1/2',
    right: 'left-[20px] top-[9px] -translate-y-1/2',
    left:  'right-[20px] top-[9px] -translate-y-1/2',
  }[placement];

  return L.divIcon({
    className: '',
    iconSize: [PIN_W, PIN_H],
    iconAnchor: [PIN_W / 2, PIN_H], // bottom-center = teardrop tip = actual lat/lng
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
      // The selected village floats above EVERY other layer including the
      // district-HQ label pane — Ramsing was getting hidden behind the
      // YINGKIONG label when selected; the dedicated 'selectedPin' pane
      // (zIndex 720) keeps it on top regardless.
      pane={selected ? 'selectedPin' : 'markerPane'}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{
        click: (e) => onClick(village, e),
      }}
    />
  );
}
