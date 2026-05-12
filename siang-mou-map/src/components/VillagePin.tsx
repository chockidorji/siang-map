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

function ariaLabel(v: Village): string {
  const pct =
    v.mou.percentAgreed === null
      ? 'percent agreed not available'
      : `${v.mou.percentAgreed.toFixed(1)} percent agreed`;
  const approx = v.isApproximate ? ', approximate location' : '';
  return `${v.name}, MoU signed ${v.mou.signedOn}, ${v.mou.households} households, ${pct}${approx}. Press Enter for details.`;
}

function buildIcon(village: Village, placement: LabelPlacement): L.DivIcon {
  const is100 = village.mou.percentAgreed === 100;
  const dotClasses = village.isApproximate
    ? 'border-[2px] border-dashed border-red-600 bg-white'
    : 'bg-red-600 border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]';
  const star = is100
    ? '<span class="absolute -top-2 -right-2 text-amber-500 text-[14px] leading-none">★</span>'
    : '';

  // Chip is anchored below the pin by default. For dense clusters the parent
  // can flip it above to reduce overlap.
  const chipPos =
    placement === 'above'
      ? 'left-1/2 bottom-[20px] -translate-x-1/2'
      : 'left-1/2 top-[20px] -translate-x-1/2';

  return L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `
      <div class="relative" style="width:16px;height:16px;" role="img" aria-label="${ariaLabel(village).replace(/"/g, '&quot;')}">
        <div class="absolute inset-0 rounded-full ${dotClasses}"></div>
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
