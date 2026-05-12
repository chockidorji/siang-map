import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Village } from '../data/villages';

interface Props {
  village: Village;
  onHover: (village: Village | null, event?: L.LeafletMouseEvent) => void;
}

function buildIcon(village: Village): L.DivIcon {
  const is100 = village.mou.percentAgreed === 100;
  const dotClasses = village.isApproximate
    ? 'border-[2px] border-dashed border-red-600 bg-white'
    : 'bg-red-600 border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]';
  const star = is100
    ? '<span class="absolute -top-2 -right-2 text-amber-500 text-[14px] leading-none">★</span>'
    : '';

  return L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `
      <div class="relative" style="width:16px;height:16px;">
        <div class="absolute inset-0 rounded-full ${dotClasses}"></div>
        ${star}
        <div class="absolute left-1/2 top-[20px] -translate-x-1/2 whitespace-nowrap
                    rounded-md bg-white px-2 py-[2px] text-[11px] font-medium text-gray-900
                    shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-gray-200">
          ${village.name}
        </div>
      </div>
    `,
  });
}

export default function VillagePin({ village, onHover }: Props) {
  return (
    <Marker
      position={[village.lat, village.lng]}
      icon={buildIcon(village)}
      eventHandlers={{
        mouseover: (e) => onHover(village, e),
        mouseout: () => onHover(null),
      }}
    />
  );
}
