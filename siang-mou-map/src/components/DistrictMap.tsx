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

function FlyTo({ district }: { district: District }) {
  const map = useMap();
  useEffect(() => {
    map.flyToBounds(DISTRICT_BOUNDS[district], {
      duration: 0.8,
      easeLinearity: 0.25,
      padding: [40, 40],
    });
  }, [district, map]);
  return null;
}

type GeoData = GeoJSON.FeatureCollection | null;

function useGeoJson(path: string): GeoData {
  const [data, setData] = useState<GeoData>(null);
  useEffect(() => {
    fetch(path).then(r => r.json()).then(setData).catch(() => setData(null));
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

  function handleHover(village: Village | null, e?: L.LeafletMouseEvent) {
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
        boundsOptions={{ padding: [40, 40] }}
        scrollWheelZoom
        zoomControl
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
