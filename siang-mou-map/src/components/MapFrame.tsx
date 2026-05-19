import { type District } from '../data/villages';

interface Props {
  district: District;
  districtName: string;
  children: React.ReactNode;
}

const SHEET_CODE: Record<District, string> = {
  'siang':       'SHEET A',
  'upper-siang': 'SHEET B',
};

// Cartographic frame around the live Leaflet map — hairline rule + inner
// double rule, sheet code chip floated over the top edge, compass and
// figure caption at the bottom corners. Purely chrome — the inset div is
// the slot where DistrictMap renders.
export default function MapFrame({ district, districtName, children }: Props) {
  return (
    <main
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'var(--paper)',
        overflow: 'hidden',
        padding: '32px 32px 24px',
      }}
    >
      {/* Soft paper grain */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 100% at center, transparent 0%, rgba(26,24,21,0.025) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Outer frame */}
      <div
        style={{
          position: 'absolute',
          inset: '32px',
          border: '1px solid var(--hairline)',
          pointerEvents: 'none',
        }}
      >
        {/* Inner double rule */}
        <div style={{ position: 'absolute', inset: 6, border: '0.5px solid var(--hairline-soft)' }} />

        {/* Sheet ID chip — sits on the top edge */}
        <div
          style={{
            position: 'absolute',
            top: -1,
            left: 16,
            padding: '0 8px',
            background: 'var(--paper)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.2em',
            transform: 'translateY(-50%)',
            color: 'var(--ink)',
            textTransform: 'uppercase',
          }}
        >
          {SHEET_CODE[district]} — {districtName}
        </div>

        {/* Figure caption — sits on the bottom edge, right side */}
        <div
          style={{
            position: 'absolute',
            bottom: -1,
            right: 16,
            padding: '0 8px',
            background: 'var(--paper)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.18em',
            transform: 'translateY(50%)',
            opacity: 0.55,
            textTransform: 'uppercase',
          }}
        >
          Fig. {district === 'siang' ? '2.a' : '2.b'} · District-level consent map
        </div>

      </div>

      {/* The actual map sits below the chrome */}
      <div
        style={{
          position: 'absolute',
          inset: '40px',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>

      {/* Overlays painted AFTER the map so they sit on top of the Leaflet
          container's white background. Compass + key both live here. */}
      <div
        style={{
          position: 'absolute',
          inset: '32px',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            right: 18,
            width: 44,
            height: 44,
            color: 'var(--ink)',
            opacity: 0.8,
          }}
        >
          <Compass />
        </div>
        <KeyBlock />
      </div>
    </main>
  );
}

const KEY_ROWS = [
  { fill: 'var(--status-high-fill)', stroke: 'var(--status-high-stroke)', label: '≥ 80% agreed' },
  { fill: 'var(--status-mid-fill)',  stroke: 'var(--status-mid-stroke)',  label: '40 – 80%' },
  { fill: 'var(--status-low-fill)',  stroke: 'var(--status-low-stroke)',  label: '< 40%' },
];

function KeyBlock() {
  return (
    <div
      aria-label="PFR agreement legend"
      style={{
        position: 'absolute',
        bottom: 22,
        left: 22,
        background: 'rgba(255, 255, 255, 0.94)',
        border: '1px solid var(--hairline-soft)',
        padding: '14px 18px 15px',
        color: 'var(--ink)',
        pointerEvents: 'none',
        minWidth: 200,
        boxShadow: '0 1px 2px rgba(26,24,21,0.04)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          fontSize: 11,
          letterSpacing: '0.22em',
          opacity: 0.6,
          marginBottom: 11,
          textTransform: 'uppercase',
          borderBottom: '1px solid var(--hairline-soft)',
          paddingBottom: 8,
        }}
      >
        Key · PFR Agreement
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {KEY_ROWS.map((r) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 11,
                height: 11,
                borderRadius: '50%',
                background: r.fill,
                border: `1.5px solid ${r.stroke}`,
                flex: '0 0 auto',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                letterSpacing: '0.005em',
                color: 'var(--ink)',
                opacity: 0.9,
              }}
            >
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Compass() {
  return (
    <svg viewBox="0 0 44 44" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth={0.6}>
      <circle cx={22} cy={22} r={18} />
      <circle cx={22} cy={22} r={14} strokeOpacity={0.4} />
      <line x1={22} y1={2} x2={22} y2={42} />
      <line x1={2} y1={22} x2={42} y2={22} strokeOpacity={0.4} />
      <path d="M 22 4 L 26 22 L 22 18 L 18 22 Z" fill="currentColor" stroke="none" />
      <path d="M 22 40 L 18 22 L 22 26 L 26 22 Z" fill="currentColor" fillOpacity={0.25} stroke="none" />
      <text x={22} y={2} fontFamily="IBM Plex Mono" fontSize={6} textAnchor="middle" fill="currentColor" stroke="none">
        N
      </text>
    </svg>
  );
}
