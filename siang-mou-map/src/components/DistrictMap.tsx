import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import VillagePin from './VillagePin';
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

type GeoData = GeoJSON.FeatureCollection | null;

function useGeoJson(path: string): GeoData {
  const [data, setData] = useState<GeoData>(null);
  useEffect(() => {
    // Reset to null so the GeoJSON layer doesn't briefly show stale data
    // from the previous district while the new file fetches.
    setData(null);
    let alive = true;
    fetch(path)
      .then(r => r.json())
      .then(d => { if (alive) setData(d); })
      .catch(() => { if (alive) setData(null); });
    return () => { alive = false; };
  }, [path]);
  return data;
}

export default function DistrictMap({ district }: Props) {
  const districtGeo = useGeoJson(`/geo/district-${district}.geojson`);
  const drainageGeo = useGeoJson(`/geo/drainage-${district}.geojson`);
  const riversGeo   = useGeoJson(`/geo/rivers-${district}.geojson`);

  const filteredVillages = useMemo(
    () => villages.filter(v => v.district === district),
    [district]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [hover, setHover] = useState<{ village: Village; x: number; y: number } | null>(null);

  function handleHover(village: Village | null, _e?: L.LeafletMouseEvent) {
    if (!village || !mapRef.current) {
      setHover(null);
      return;
    }
    const pt = mapRef.current.latLngToContainerPoint([village.lat, village.lng]);
    setHover({ village, x: pt.x, y: pt.y });
  }

  return (
    <div ref={containerRef} className="relative h-full w-full bg-white">
      <MapContainer
        bounds={DISTRICT_BOUNDS[district]}
        boundsOptions={{ padding: [20, 20] }}
        scrollWheelZoom
        zoomControl
        zoomSnap={0.25}
        zoomDelta={0.25}
        attributionControl={false}
        className="h-full w-full"
        ref={(m) => { if (m) mapRef.current = m; }}
      >
        <FlyTo district={district} />

        {districtGeo && (
          <GeoJSON
            key={`district-${district}`}
            data={districtGeo}
            style={{ color: '#111827', weight: 2, fillColor: '#FFFFFF', fillOpacity: 1 }}
          />
        )}
        {drainageGeo && (
          <GeoJSON
            key={`drainage-${district}`}
            data={drainageGeo}
            style={{ color: '#BFDBFE', weight: 1 }}
          />
        )}
        {riversGeo && (
          <GeoJSON
            key={`rivers-${district}`}
            data={riversGeo}
            style={{ color: '#2563EB', weight: 2 }}
          />
        )}

        {filteredVillages.map(v => (
          <VillagePin key={v.id} village={v} onHover={handleHover} />
        ))}
      </MapContainer>

      {hover && <VillageTooltip village={hover.village} x={hover.x} y={hover.y} />}
    </div>
  );
}
