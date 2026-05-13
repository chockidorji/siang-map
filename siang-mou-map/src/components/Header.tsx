// Editorial header in the Modernist Atlas style.
//   left  — DHP reference code + sheet, project title (serif), subtitle/project name (italic + mono)
//   right — "Prepared" date + issuing authority

const PROJECT = {
  reference: 'DHP/SUMP/MoU-STAT/2026-04',
  sheetCurrent: 2,
  sheetTotal: 4,
  title: 'Status of MoU — Infrastructure Project',
  subtitle: 'Siang & Upper Siang Districts',
  project: 'Siang Upper Multipurpose Storage Project (SUMP)',
  prepared: '13 May 2026',
  authority: 'Department of Hydropower Development',
};

export default function Header() {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--hairline)',
        padding: '24px 40px 18px',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'end',
        gap: 24,
        background: 'var(--paper)',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.18em',
            color: 'var(--ink)',
            opacity: 0.55,
            marginBottom: 10,
          }}
        >
          {PROJECT.reference}
          {'  ·  '}
          SHEET {String(PROJECT.sheetCurrent).padStart(2, '0')} OF {String(PROJECT.sheetTotal).padStart(2, '0')}
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-serif)',
            fontWeight: 500,
            fontSize: 36,
            lineHeight: 1.05,
            letterSpacing: '-0.012em',
          }}
        >
          {PROJECT.title}
        </h1>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            fontSize: 13,
            opacity: 0.7,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>{PROJECT.subtitle}</span>
          <span style={{ opacity: 0.4 }}>—</span>
          <span>{PROJECT.project}</span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            opacity: 0.55,
            marginBottom: 6,
          }}
        >
          PREPARED
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 500 }}>
          {PROJECT.prepared}
        </div>
        <div style={{ fontSize: 11, opacity: 0.55, marginTop: 4 }}>{PROJECT.authority}</div>
      </div>
    </header>
  );
}

export const PROJECT_META = PROJECT;
