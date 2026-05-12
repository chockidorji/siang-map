import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { MapLocation, LocationTier } from '../data/locations';

interface Props {
  location: MapLocation;
}

// Typography-only hierarchy — no pin, no icon, no chip background. Tier
// thresholds are deliberately small so even district-hq stays a label, not a
// poster — the PFR pins remain the visual focus of the map.
//
// Settlements use slate-400 (one step lighter than the HQ tiers) and 8.5px so
// they recede into the background; the higher tiers ladder up by weight and
// size, and district-hq alone gets SMALL-CAPS treatment to mark the two
// administrative seats.
function classesFor(tier: LocationTier): string {
  switch (tier) {
    case 'district-hq':
      return 'text-[12px] font-bold uppercase tracking-[0.08em] text-slate-900';
    case 'adc-hq':
      return 'text-[11px] font-semibold tracking-[0.02em] text-slate-800';
    case 'circle-eac':
      return 'text-[10px] font-semibold text-slate-700';
    case 'settlement':
    default:
      return 'text-[8.5px] font-normal text-slate-400';
  }
}

// zIndex bump so the bigger labels paint on top of smaller ones in dense
// clusters. PFR pins are unaffected — they render in the marker pane above
// the dedicated label pane (set up in DistrictMap).
function zOffsetFor(tier: LocationTier): number {
  switch (tier) {
    case 'district-hq': return 300;
    case 'adc-hq':      return 200;
    case 'circle-eac':  return 100;
    default:            return 0;
  }
}

function buildIcon(location: MapLocation): L.DivIcon {
  // `className: ''` skips Leaflet's `leaflet-div-icon` default (which adds a
  // white box + grey border). The inner element handles its own centring via
  // a CSS translate, so iconSize/iconAnchor stay at 0,0 — the lat/lng point
  // sits at the centre of the rendered text.
  const safeName = location.name.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
  return L.divIcon({
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    // The `location-label-{tier}` class lets the labelPane fade out a tier
    // based on the current zoom (see .labelpane-zoomed-out rules in CSS).
    html: `<span class="location-label location-label-${location.tier} ${classesFor(location.tier)}" aria-hidden="true">${safeName}</span>`,
  });
}

export default function LocationLabel({ location }: Props) {
  // District-HQ labels go into the elevated `districtHqPane` (zIndex 680)
  // so they paint over any PFR pin chip that happens to share a screen
  // position at the whole-district zoom. Everything else stays below the
  // marker pane in `labelPane` (550).
  const pane = location.tier === 'district-hq' ? 'districtHqPane' : 'labelPane';
  return (
    <Marker
      position={[location.lat, location.lng]}
      icon={buildIcon(location)}
      // Pure annotation — must not steal map clicks or keyboard focus from
      // the PFR pins.
      interactive={false}
      keyboard={false}
      pane={pane}
      zIndexOffset={zOffsetFor(location.tier)}
    />
  );
}
