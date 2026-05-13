import { useMemo } from 'react';
import { type District, type Status, type Village, statusOf } from '../data/villages';

export type StatusFilters = Record<Status, boolean>;

interface Props {
  district: District;
  onDistrictChange: (d: District) => void;
  query: string;
  onQueryChange: (q: string) => void;
  filters: StatusFilters;
  onFiltersChange: (next: StatusFilters) => void;
  villages: Village[];          // already filtered to current district
  allVillages: Village[];       // full list (for cross-district counts)
  selectedId: string | null;
  onSelect: (v: Village) => void;
}

const STATUS_ORDER: Status[] = ['high', 'mid', 'low', 'none'];
const STATUS_LABEL: Record<Status, string> = {
  high: '≥ 80% agreed',
  mid: '40 – 80%',
  low: '< 40%',
  none: 'No MoU yet',
};
const STATUS_VAR: Record<Status, { fill: string; stroke: string }> = {
  high: { fill: 'var(--status-high-fill)', stroke: 'var(--status-high-stroke)' },
  mid:  { fill: 'var(--status-mid-fill)',  stroke: 'var(--status-mid-stroke)'  },
  low:  { fill: 'var(--status-low-fill)',  stroke: 'var(--status-low-stroke)'  },
  none: { fill: 'var(--status-none-fill)', stroke: 'var(--status-none-stroke)' },
};

const DISTRICTS: Array<{ id: District; label: string }> = [
  { id: 'siang',       label: 'Siang' },
  { id: 'upper-siang', label: 'Upper Siang' },
];

export default function Sidebar({
  district, onDistrictChange,
  query, onQueryChange,
  filters, onFiltersChange,
  villages, allVillages,
  selectedId, onSelect,
}: Props) {
  // Visible list: respect status filters + search query.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return villages.filter((v) => {
      const s = statusOf(v);
      if (!filters[s]) return false;
      if (q && !v.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [villages, filters, query]);

  // Per-status count for the filter checkboxes.
  const counts = useMemo(() => {
    const c: Record<Status, number> = { high: 0, mid: 0, low: 0, none: 0 };
    for (const v of villages) c[statusOf(v)] += 1;
    return c;
  }, [villages]);

  return (
    <aside
      className="flex flex-col overflow-hidden border-r"
      style={{
        borderColor: 'var(--hairline)',
        padding: '24px 24px 24px 40px',
        gap: 18,
        background: 'var(--paper)',
      }}
    >
      {/* District switcher */}
      <Section label="District">
        <div style={{ display: 'grid', marginTop: 8 }}>
          {DISTRICTS.map((d) => {
            const active = d.id === district;
            const count = allVillages.filter((v) => v.district === d.id).length;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onDistrictChange(d.id)}
                style={{
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderTop: `1px solid var(--hairline-soft)`,
                  cursor: 'pointer',
                  padding: '10px 0',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 19,
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--ink)' : 'rgba(26,24,21,0.5)',
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span>{d.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 400, opacity: 0.6 }}>
                  {count} MoU
                </span>
              </button>
            );
          })}
          <div style={{ borderTop: '1px solid var(--hairline-soft)' }} />
        </div>
      </Section>

      {/* Search */}
      <Section label="Find settlement">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Type to filter…"
          style={{
            width: '100%',
            marginTop: 8,
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--hairline)',
            fontFamily: 'var(--font-serif)',
            fontSize: 18,
            padding: '8px 0',
            outline: 'none',
            color: 'var(--ink)',
          }}
        />
      </Section>

      {/* PFR status filters */}
      <Section label="PFR agreement">
        <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
          {STATUS_ORDER.map((k) => {
            const pal = STATUS_VAR[k];
            const on = filters[k];
            return (
              <label
                key={k}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '6px 0',
                  cursor: 'pointer',
                  opacity: on ? 1 : 0.35,
                  transition: 'opacity 160ms',
                }}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => onFiltersChange({ ...filters, [k]: e.target.checked })}
                  style={{ width: 14, height: 14, accentColor: 'var(--ink)', margin: 0 }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: pal.fill,
                    border: `1px solid ${pal.stroke}`,
                    flex: '0 0 auto',
                  }}
                />
                <span style={{ fontSize: 13, flex: 1 }}>{STATUS_LABEL[k]}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.55 }}>
                  {counts[k]}
                </span>
              </label>
            );
          })}
        </div>
      </Section>

      {/* Index list */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Section label={`Index (${visible.length})`} />
        <div style={{ marginTop: 8, overflow: 'auto', flex: 1, paddingRight: 4 }}>
          {visible.map((v) => {
            const s = statusOf(v);
            const pal = STATUS_VAR[s];
            const active = selectedId === v.id;
            const pct = v.mou.percentAgreed;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '12px 1fr auto',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '7px 0',
                  borderTop: '1px solid var(--hairline-extra-soft)',
                  background: active ? 'rgba(26,24,21,0.04)' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--ink)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: pal.fill,
                    border: `0.5px solid ${pal.stroke}`,
                  }}
                />
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: active ? 600 : 400 }}>
                  {v.name}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.6 }}>
                  {pct === null ? '—' : `${pct.toFixed(1)}%`}
                </span>
              </button>
            );
          })}
          {visible.length === 0 && (
            <div style={{ padding: '14px 0', fontStyle: 'italic', fontSize: 13, opacity: 0.5 }}>
              No settlements match the current filters.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function Section({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          opacity: 0.55,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
