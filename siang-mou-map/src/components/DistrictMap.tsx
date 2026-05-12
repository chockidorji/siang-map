import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import VillagePin, { type LabelPlacement } from './VillagePin';
import VillageTooltip from './VillageTooltip';
import { villages, DISTRICT_BOUNDS, type District, type Village } from '../data/villages';

interface Props {
  district: District;
}

// On every district change: invalidateSize so Leaflet picks up the actual
// container height (flex children frequently report 0 at mount), then fit
// bounds. First time uses an instant snap; subsequent tab switches animate.
// Also re-fits on container resize so the view stays centered if the user
// changes the window size mid-presentation.
function FlyTo({ district }: { district: District }) {
  const map = useMap();
  const seen = useRef<District | null>(null);
  const lastDistrict = useRef<District>(district);
  lastDistrict.current = district;

  useEffect(() => {
    // Call synchronously — both rAF and setTimeout are throttled when the
    // browser tab isn't focused (Chrome's background throttling), which
    // meant the fitBounds never fired on tab switches during dev. React's
    // useEffect already runs after layout, so the container has its size.
    map.invalidateSize({ animate: false });
    const FIT_OPTS = { padding: [20, 20] as [number, number] };
    const bounds = DISTRICT_BOUNDS[district];
    if (seen.current === null) {
      map.fitBounds(bounds, FIT_OPTS);
    } else {
      map.flyToBounds(bounds, {
        ...FIT_OPTS,
        duration: 0.8,
        easeLinearity: 0.25,
      });
    }
    seen.current = district;
  }, [district, map]);

  // Re-fit on window resize so re-flowed canvas stays correct.
  useEffect(() => {
    const onResize = () => {
      map.invalidateSize({ animate: false });
      map.fitBounds(DISTRICT_BOUNDS[lastDistrict.current], { padding: [20, 20] });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [map]);

  return null;
}

// --- GeoJSON loader with error tracking --------------------------------------
type GeoData = GeoJSON.FeatureCollection | null;
interface GeoState { data: GeoData; error: string | null }

function useGeoJson(path: string): GeoState {
  const [state, setState] = useState<GeoState>({ data: null, error: null });
  useEffect(() => {
    // Reset to null so the GeoJSON layer doesn't briefly show stale data
    // from the previous district while the new file fetches.
    setState({ data: null, error: null });
    let alive = true;
    fetch(path)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (alive) setState({ data: d, error: null });
      })
      .catch((e) => {
        if (alive) {
          // Surfaced via the LayerStatusBanner; also leave a breadcrumb in
          // the console so the operator can see the underlying error.
          // eslint-disable-next-line no-console
          console.error(`[GeoJSON] failed to load ${path}:`, e);
          setState({ data: null, error: e?.message || 'failed to load' });
        }
      });
    return () => {
      alive = false;
    };
  }, [path]);
  return state;
}

// --- Dense-label placement ---------------------------------------------------
// Greedy: walk pins in stable order; for each pin, if any already-placed pin
// within ~0.025° (degrees ≈ a couple kilometres at this latitude) has its
// label below, flip this pin's label above. Reduces overlap in tight clusters
// without changing the always-visible-label intent.
function computePlacements(list: Village[]): Map<string, LabelPlacement> {
  const out = new Map<string, LabelPlacement>();
  const THRESHOLD = 0.025;
  for (const v of list) {
    let placement: LabelPlacement = 'below';
    for (const [otherId, otherPlacement] of out) {
      const other = list.find((x) => x.id === otherId)!;
      const dLat = v.lat - other.lat;
      // longitude scaled by cos(lat) so we get roughly equal-distance units.
      const dLng = (v.lng - other.lng) * Math.cos((v.lat * Math.PI) / 180);
      const dist = Math.hypot(dLat, dLng);
      if (dist < THRESHOLD && otherPlacement === placement) {
        placement = placement === 'below' ? 'above' : 'below';
      }
    }
    out.set(v.id, placement);
  }
  return out;
}

// --- Operator-facing layer-load banner ---------------------------------------
function LayerStatusBanner({ failed }: { failed: string[] }) {
  if (failed.length === 0) return null;
  return (
    <div
      role="alert"
      className="absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-md border
                 border-amber-300 bg-amber-50 px-3 py-2 text-[12px] text-amber-900
                 shadow-md"
    >
      <strong className="font-semibold">Map layer{failed.length > 1 ? 's' : ''} failed to load:</strong>{' '}
      {failed.join(', ')}. The rest of the map is still usable. Try reloading the page.
    </div>
  );
}

// --- Main component ---------------------------------------------------------
// Drawer-style status card lives at the right edge, so we no longer need to
// track the pin's pixel position — just which village is active and how it
// was opened.
type ActiveCard = {
  village: Village;
  source: 'hover' | 'pinned';
} | null;

export default function DistrictMap({ district }: Props) {
  const districtGeo = useGeoJson(`/geo/district-${district}.geojson`);
  const drainageGeo = useGeoJson(`/geo/drainage-${district}.geojson`);
  const riversGeo = useGeoJson(`/geo/rivers-${district}.geojson`);

  const filteredVillages = useMemo(
    () => villages.filter((v) => v.district === district),
    [district],
  );

  const placements = useMemo(() => computePlacements(filteredVillages), [filteredVillages]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const [active, setActive] = useState<ActiveCard>(null);

  function handleHover(village: Village | null) {
    // Pinned cards take precedence — a stray mouse-move shouldn't replace them.
    if (active?.source === 'pinned') return;
    setActive(village ? { village, source: 'hover' } : null);
  }

  function handleClick(village: Village) {
    // Clicking the same pin again closes its card.
    if (active?.village.id === village.id && active.source === 'pinned') {
      setActive(null);
      return;
    }
    setActive({ village, source: 'pinned' });
  }

  // ESC closes any active card (hover or pinned).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Click on the map background (not a pin) dismisses a pinned card. We hook
  // this via the raw map ref instead of useMapEvents so the handler lives next
  // to the rest of the active-card state.
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    const onMapClick = () => {
      setActive((prev) => (prev?.source === 'pinned' ? null : prev));
    };
    m.on('click', onMapClick);
    return () => {
      m.off('click', onMapClick);
    };
  }, [district]);

  // Drop a stale pinned card when the user changes districts (the village
  // belongs to the previous district).
  useEffect(() => {
    setActive((prev) => (prev && prev.village.district !== district ? null : prev));
  }, [district]);

  const failedLayers = [
    districtGeo.error ? 'district outline' : null,
    drainageGeo.error ? 'drainage' : null,
    riversGeo.error ? 'rivers' : null,
  ].filter((x): x is string => Boolean(x));

  return (
    <div ref={containerRef} className="relative h-full w-full bg-white">
      <MapContainer
        bounds={DISTRICT_BOUNDS[district]}
        boundsOptions={{ padding: [20, 20] }}
        // scrollWheelZoom intentionally OFF: presenters scrolling the page
        // were accidentally zooming the map. The +/- zoom buttons remain.
        scrollWheelZoom={false}
        zoomControl
        zoomSnap={0.25}
        zoomDelta={0.25}
        attributionControl={false}
        className="h-full w-full"
        ref={mapRef}
      >
        <FlyTo district={district} />

        {districtGeo.data && (
          <GeoJSON
            key={`district-${district}`}
            data={districtGeo.data}
            style={{ color: '#111827', weight: 2, fillColor: '#FFFFFF', fillOpacity: 1 }}
          />
        )}
        {drainageGeo.data && (
          <GeoJSON
            key={`drainage-${district}`}
            data={drainageGeo.data}
            style={{ color: '#BFDBFE', weight: 1 }}
          />
        )}
        {riversGeo.data && (
          <GeoJSON
            key={`rivers-${district}`}
            data={riversGeo.data}
            style={{ color: '#2563EB', weight: 2 }}
          />
        )}

        {filteredVillages.map((v) => (
          <VillagePin
            key={v.id}
            village={v}
            placement={placements.get(v.id)}
            onHover={handleHover}
            onClick={handleClick}
          />
        ))}
      </MapContainer>

      <LayerStatusBanner failed={failedLayers} />

      {active && (
        <VillageTooltip
          village={active.village}
          source={active.source}
          onDismiss={() => setActive(null)}
        />
      )}
    </div>
  );
}
