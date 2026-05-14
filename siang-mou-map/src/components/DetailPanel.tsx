import { type Village, statusOf } from '../data/villages';

interface Props {
  village: Village | null;
  districtName: string;
}

const STATUS_LABEL = {
  high: '≥ 80% agreed',
  mid:  '40 – 80%',
  low:  '< 40%',
  // Angging / Singging / Resing all signed MoUs on 7 May 2026, but the
  // Department's sheet shows the percentage as '—' because the recorded
  // 'agreed' count exceeds the household count (mathematically impossible).
  // Until those figures are reconciled, the badge says so explicitly
  // rather than implying no MoU exists.
  none: 'Data Pending Review',
} as const;

const STATUS_PAL = {
  high: { fill: 'var(--status-high-fill)', stroke: 'var(--status-high-stroke)' },
  mid:  { fill: 'var(--status-mid-fill)',  stroke: 'var(--status-mid-stroke)'  },
  low:  { fill: 'var(--status-low-fill)',  stroke: 'var(--status-low-stroke)'  },
  none: { fill: 'var(--status-none-fill)', stroke: 'var(--status-none-stroke)' },
} as const;

export default function DetailPanel({ village, districtName }: Props) {
  return (
    <aside
      style={{
        height: '100%',
        borderLeft: '1px solid var(--hairline)',
        padding: '22px 28px 22px 24px',
        overflow: 'auto',
        background: 'var(--paper)',
      }}
    >
      {village ? <Detail v={village} districtName={districtName} /> : <Empty />}
    </aside>
  );
}

function Detail({ v, districtName }: { v: Village; districtName: string }) {
  const s = statusOf(v);
  const pal = STATUS_PAL[s];
  const pct = v.mou.percentAgreed;
  const docCode = v.id.toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Heading */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.2em',
            opacity: 0.55,
            marginBottom: 8,
            textTransform: 'uppercase',
          }}
        >
          {districtName}
          {v.circle ? ` · ${v.circle.toUpperCase()} CIRCLE` : ''}
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            fontWeight: 500,
            letterSpacing: '-0.015em',
            lineHeight: 1,
          }}
        >
          {v.name}
        </h2>
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12,
            opacity: 0.65,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 8px',
              border: `1px solid ${pal.stroke}`,
              color: pal.stroke,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            <span style={{ width: 6, height: 6, background: pal.fill, borderRadius: '50%' }} />
            {STATUS_LABEL[s]}
          </span>
          <span style={{ fontStyle: 'italic' }}>MoU {v.mou.signedOn}</span>
        </div>
      </div>

      {/* Big agreement number */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.2em',
            opacity: 0.55,
            textTransform: 'uppercase',
          }}
        >
          Agreement Rate
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 500,
            fontSize: 72,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            marginTop: 4,
            color: pal.stroke,
          }}
        >
          {pct === null ? '—' : pct.toFixed(1)}
          {pct !== null && <span style={{ fontSize: 32, opacity: 0.5 }}>%</span>}
        </div>
        <AgreementBar value={pct ?? 0} fill={pal.fill} />
      </div>

      {/* Households / Agreed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <Stat label="Households">{v.mou.households}</Stat>
        <Stat label="Agreed for PFR">{v.mou.agreedForPFR}</Stat>
      </div>

      {/* Custodians — placeholder, real data not yet captured */}
      <div style={{ borderTop: '1px solid var(--hairline-soft)', paddingTop: 18 }}>
        <SectionLabel>Custodians</SectionLabel>
        <div style={{ marginTop: 10, fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 500, opacity: 0.45 }}>
          —
        </div>
        <div style={{ fontSize: 12, opacity: 0.55, marginTop: 2 }}>
          Gaon Burah · to be recorded
        </div>
      </div>

      {/* Documents */}
      <div style={{ borderTop: '1px solid var(--hairline-soft)', paddingTop: 18 }}>
        <SectionLabel>Documents</SectionLabel>
        <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
          {[
            { name: 'Memorandum of Understanding',  code: `MoU-${docCode}`, state: 'signed' as const },
            { name: 'Preliminary Feasibility Report', code: `PFR-2026-${docCode.slice(-4)}`, state: 'shared' as const },
            { name: 'Household consent register',   code: `HCR-${docCode}`, state: s === 'high' ? 'closed' as const : 'in progress' as const },
          ].map((d) => (
            <li
              key={d.code}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'baseline',
                gap: 8,
                paddingBottom: 8,
                borderBottom: '1px solid var(--hairline-extra-soft)',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 500 }}>{d.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.55, marginTop: 2 }}>{d.code}</div>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                }}
              >
                {d.state}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {v.isApproximate && (
        <div style={{ fontSize: 11, opacity: 0.5, fontStyle: 'italic' }}>
          Pin location is approximate — coordinates eyeballed from the printed atlas.
        </div>
      )}
    </div>
  );
}

function AgreementBar({ value, fill }: { value: number; fill: string }) {
  return (
    <div
      style={{
        height: 3,
        background: 'var(--hairline-soft)',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 12,
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height: '100%',
          background: fill,
          transition: 'width 360ms cubic-bezier(.2,.7,.3,1)',
        }}
      />
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 34,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          marginTop: 4,
          lineHeight: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.2em',
        opacity: 0.55,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div
      style={{
        opacity: 0.5,
        fontStyle: 'italic',
        fontFamily: 'var(--font-serif)',
        fontSize: 14,
      }}
    >
      Click any pin to view settlement details.
    </div>
  );
}
