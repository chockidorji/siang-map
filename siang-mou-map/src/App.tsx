import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Sidebar, { type StatusFilters } from './components/Sidebar';
import DetailPanel from './components/DetailPanel';
import MapFrame from './components/MapFrame';
import DistrictMap from './components/DistrictMap';
import { villages, statusOf, type District, type Village } from './data/villages';

const DEFAULT_FILTERS: StatusFilters = { high: true, mid: true, low: true, none: true };

const DISTRICT_LABEL: Record<District, string> = {
  'siang':       'Siang District',
  'upper-siang': 'Upper Siang District',
};

export default function App() {
  const [district, setDistrict] = useState<District>('upper-siang');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<StatusFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Villages in the active district.
  const districtVillages = useMemo(
    () => villages.filter((v) => v.district === district),
    [district],
  );

  // Visible after status filter + name query.
  const visibleVillages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return districtVillages.filter((v) => {
      if (!filters[statusOf(v)]) return false;
      if (q && !v.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [districtVillages, filters, query]);

  const visibleVillageIds = useMemo(() => new Set(visibleVillages.map((v) => v.id)), [visibleVillages]);

  // When district changes, pre-select the highest-agreement village so the
  // detail panel isn't blank.
  useEffect(() => {
    const pick =
      districtVillages.find((v) => statusOf(v) === 'high') ?? districtVillages[0] ?? null;
    setSelectedId(pick?.id ?? null);
    setQuery('');
  }, [district, districtVillages]);

  const selected = useMemo(
    () => districtVillages.find((v) => v.id === selectedId) ?? null,
    [districtVillages, selectedId],
  );

  function handleSelect(v: Village) {
    setSelectedId(v.id);
  }

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--paper)',
        color: 'var(--ink)',
        display: 'grid',
        // Map is the headline. Sidebars trimmed (was 320 / 380) so the
        // polygon gets the remaining width.
        gridTemplateColumns: '260px 1fr 300px',
        gridTemplateRows: 'auto 1fr auto',
        gridTemplateAreas:
          '"head head head" "side map detail" "foot foot foot"',
      }}
    >
      <div style={{ gridArea: 'head' }}>
        <Header />
      </div>

      <div style={{ gridArea: 'side', minHeight: 0 }}>
        <Sidebar
          district={district}
          onDistrictChange={setDistrict}
          query={query}
          onQueryChange={setQuery}
          filters={filters}
          onFiltersChange={setFilters}
          villages={districtVillages}
          allVillages={villages}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      <div style={{ gridArea: 'map', minHeight: 0, minWidth: 0 }}>
        <MapFrame district={district} districtName={DISTRICT_LABEL[district]}>
          <DistrictMap
            district={district}
            visibleVillageIds={visibleVillageIds}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </MapFrame>
      </div>

      <div style={{ gridArea: 'detail', minHeight: 0 }}>
        <DetailPanel village={selected} districtName={DISTRICT_LABEL[district]} />
      </div>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer
      style={{
        gridArea: 'foot',
        borderTop: '1px solid var(--hairline)',
        padding: '14px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        opacity: 0.6,
        background: 'var(--paper)',
      }}
    >
      <span>Department of Hydropower Development</span>
      <span>Fig. 2 — District-level Consent Map</span>
      <span>DHP/SUMP/MoU-STAT/2026-04</span>
    </footer>
  );
}
