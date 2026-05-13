// Compact header — single dynamic title, no chrome. The reference code, the
// project name, the prepared date and authority all live in the footer now;
// the headline this sheet exists for is the only thing the eye should land
// on at the top.

import type { District } from '../data/villages';

interface Props {
  districtName: string;
  district: District;
}

const PROJECT_REFERENCE = 'DHP/SUMP/MoU-STAT/2026-04';

export default function Header({ districtName }: Props) {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--hairline)',
        padding: '12px 40px',
        background: 'var(--paper)',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 24,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--font-serif)',
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: '-0.012em',
          lineHeight: 1.15,
        }}
      >
        <span
          style={{
            // Editorial accent — the noun phrase gets the ochre underline,
            // the rest of the sentence stays in plain ink.
            borderBottom: '2px solid var(--status-mid-fill)',
            paddingBottom: 1,
          }}
        >
          MoUs Signed
        </span>{' '}
        with Villages in {districtName}
      </h1>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.16em',
          color: 'var(--ink)',
          opacity: 0.45,
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        {PROJECT_REFERENCE}
      </span>
    </header>
  );
}
