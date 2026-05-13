import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import VillagePin, { type LabelPlacement } from './VillagePin';
import LocationLabel from './LocationLabel';
import { villages, DISTRICT_BOUNDS, type District, type Village } from '../data/villages';
import { mapLocations } from '../data/locations';

interface Props {
  district: District;
  /** Set of village IDs that should currently be rendered as pins.
   *  Driven by the sidebar's status filters + search query. */
  visibleVillageIds: Set<string>;
  /** Selected village (from sidebar or pin click). */
  selectedId: string | null;
  onSelect: (v: Village) => void;
}

// Re-fit bounds on every district change so each tab fills the new
// (polygon-sized) viewBox. Synchronous to dodge background-tab throttling.
function FlyTo({ district }: { district: District }) {
  const map = useMap();
  const seen = useRef<District | null>(null);

  useEffect(() => {
    try {
      map.invalidateSize({ animate: false });
      const bounds = DISTRICT_BOUNDS[district];
      if (seen.current === null) {
        map.fitBounds(bounds, { padding: [6, 6] });
      } else {
        map.flyToBounds(bounds, { padding: [6, 6], duration: 0.8, easeLinearity: 0.25 });
      }
      seen.current = district;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[FlyTo] effect threw:', e);
    }
  }, [district, map]);

  useEffect(() => {
    const onResize = () => {
      try {
        map.invalidateSize({ animate: false });
        map.fitBounds(DISTRICT_BOUNDS[district], { padding: [6, 6] });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[FlyTo] resize threw:', e);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [map, district]);

  return null;
}

// Custom Leaflet pane for the non-PFR text labels (zIndex 550) and a second
// pane for district-HQ labels (zIndex 680) so YINGKIONG / BOLENG paint over
// any PFR chip that shares their screen position. Also toggles
// `labelpane-zoomed-out` on the label pane when the user drops below
// SETTLEMENT_REVEAL_ZOOM — CSS fades settlements there.
const SETTLEMENT_REVEAL_ZOOM = 10;
function LabelPaneInit() {
  const map = useMap();
  useEffect(() => {
    let pane = map.getPane('labelPane');
    if (!pane) {
      pane = map.createPane('labelPane');
      pane.style.zIndex = '550';
      pane.style.pointerEvents = 'none';
    }
    if (!map.getPane('districtHqPane')) {
      const top = map.createPane('districtHqPane');
      top.style.zIndex = '680';
      top.style.pointerEvents = 'none';
    }
    // Selected village floats above EVERYTHING — district HQ labels included.
    // VillagePin opts into this pane when its `selected` prop is true.
    if (!map.getPane('selectedPin')) {
      const sel = map.createPane('selectedPin');
      sel.style.zIndex = '720';
    }
    const apply = () => {
      pane!.classList.toggle('labelpane-zoomed-out', map.getZoom() < SETTLEMENT_REVEAL_ZOOM);
    };
    apply();
    map.on('zoomend', apply);
    return () => {
      map.off('zoomend', apply);
    };
  }, [map]);
  return null;
}

type GeoData = GeoJSON.FeatureCollection | null;
interface GeoState { data: GeoData; error: string | null }

function useGeoJson(path: string): GeoState {
  const [state, setState] = useState<GeoState>({ data: null, error: null });
  useEffect(() => {
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

// 4-direction greedy chip placement to fan out dense PFR clusters.
function computePlacements(list: Village[]): Map<string, LabelPlacement> {
  const out = new Map<string, LabelPlacement>();
  const THRESHOLD = 0.025;
  const CANDIDATES: LabelPlacement[] = ['below', 'above', 'right', 'left'];
  for (const v of list) {
    const conflicts: Record<LabelPlacement, number> = { below: 0, above: 0, right: 0, left: 0 };
    for (const [otherId, otherPlacement] of out) {
      const other = list.find((x) => x.id === otherId)!;
      const dLat = v.lat - other.lat;
      const dLng = (v.lng - other.lng) * Math.cos((v.lat * Math.PI) / 180);
      if (Math.hypot(dLat, dLng) < THRESHOLD) conflicts[otherPlacement] += 1;
    }
    let best: LabelPlacement = 'below';
    let bestScore = Number.POSITIVE_INFINITY;
    for (const c of CANDIDATES) {
      if (conflicts[c] < bestScore) {
        bestScore = conflicts[c];
        best = c;
      }
    }
    out.set(v.id, best);
  }
  return out;
}

function LayerStatusBanner({ failed }: { failed: string[] }) {
  if (failed.length === 0) return null;
  return (
    <div
      role="alert"
      style={{
        position: 'absolute',
        left: '50%',
        top: 12,
        transform: 'translateX(-50%)',
        zIndex: 1000,
        border: '1px solid var(--status-mid-stroke)',
        background: 'var(--paper-alt)',
        color: 'var(--status-mid-stroke)',
        padding: '6px 10px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.05em',
      }}
    >
      <strong style={{ fontWeight: 600 }}>Map layer{failed.length > 1 ? 's' : ''} failed to load:</strong>{' '}
      {failed.join(', ')}.
    </div>
  );
}

export default function DistrictMap({ district, visibleVillageIds, selectedId, onSelect }: Props) {
  const districtGeo = useGeoJson(`/geo/district-${district}.geojson`);
  const drainageGeo = useGeoJson(`/geo/drainage-${district}.geojson`);
  const riversGeo = useGeoJson(`/geo/rivers-${district}.geojson`);

  const districtVillages = useMemo(
    () => villages.filter((v) => v.district === district),
    [district],
  );
  const filteredVillages = useMemo(
    () => districtVillages.filter((v) => visibleVillageIds.has(v.id)),
    [districtVillages, visibleVillageIds],
  );
  const filteredLabels = useMemo(
    () => mapLocations.filter((l) => l.district === district),
    [district],
  );
  // Compute placements over the FULL district list (not filter-narrowed) so a
  // chip's position stays stable as the user toggles filters.
  const placements = useMemo(() => computePlacements(districtVillages), [districtVillages]);

  const failedLayers = [
    districtGeo.error ? 'district outline' : null,
    drainageGeo.error ? 'drainage' : null,
    riversGeo.error ? 'rivers' : null,
  ].filter((x): x is string => Boolean(x));

  return (
    <div className="relative h-full w-full" style={{ background: 'var(--paper)' }}>
      <MapContainer
        bounds={DISTRICT_BOUNDS[district]}
        boundsOptions={{ padding: [6, 6] as [number, number] }}
        // Scroll-wheel zoom intentionally off — presenters scrolling the page
        // were accidentally zooming the map. The +/- control remains.
        scrollWheelZoom={false}
        zoomControl
        zoomSnap={0.25}
        zoomDelta={0.25}
        attributionControl={false}
        className="h-full w-full"
      >
        <FlyTo district={district} />
        <LabelPaneInit />

        {districtGeo.data && (
          <GeoJSON
            key={`district-${district}`}
            data={districtGeo.data}
            // White land — same as the surrounding paper. The black hairline
            // border is the only thing defining the district outline.
            style={{ color: '#2a2622', weight: 1.2, fillColor: '#ffffff', fillOpacity: 1 }}
          />
        )}
        {drainageGeo.data && (
          <GeoJSON
            key={`drainage-${district}`}
            data={drainageGeo.data}
            // Subtle muted blue for fine drainage, in the same family as the
            // bigger rivers but quieter.
            style={{ color: '#aac3d8', weight: 0.7, opacity: 0.7 }}
          />
        )}
        {riversGeo.data && (
          <GeoJSON
            key={`rivers-${district}`}
            data={riversGeo.data}
            style={{ color: '#5a7fa3', weight: 1.4, opacity: 0.85 }}
          />
        )}

        {/* Non-PFR text labels first */}
        {filteredLabels.map((loc) => (
          <LocationLabel key={loc.id} location={loc} />
        ))}

        {/* PFR pins — filtered by sidebar */}
        {filteredVillages.map((v) => (
          <VillagePin
            key={v.id}
            village={v}
            placement={placements.get(v.id)}
            selected={selectedId === v.id}
            onClick={onSelect}
          />
        ))}
      </MapContainer>

      <LayerStatusBanner failed={failedLayers} />
    </div>
  );
}
