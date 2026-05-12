// Build the non-PFR locations dataset from the shapefile-derived GeoJSON.
//
// Reads scripts/_important.geojson (admin HQs) and scripts/_settlement.geojson
// (every settlement from the official SHP). Drops anything within 0.005°
// (~500 m) of a PFR village so we don't double-label the pins. Classifies the
// remainder into four tiers — District HQ / ADC HQ / Circle-EAC HQ /
// Settlement — and assigns each to a district by lat threshold + manual
// overrides for the cases where the heuristic gets it wrong.
//
// Run once whenever the source shapefiles or the PFR village list change:
//   node scripts/build-locations.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const important = JSON.parse(
  readFileSync(path.join(__dirname, '_important.geojson'), 'utf8'),
);
const settlements = JSON.parse(
  readFileSync(path.join(__dirname, '_settlement.geojson'), 'utf8'),
);

// PFR villages already rendered as pins — keep in sync with src/data/villages.ts.
// We dedupe against these by proximity (≤0.005°) so the labels never collide
// with the PFR pin chips.
const PFR_COORDS = [
  [28.483800, 95.111100], // Komkar
  [28.568795, 95.056778], // Karko
  [28.602500, 95.069440], // Simong
  [28.742530, 94.934200], // Pugging
  [28.662951, 94.990293], // Ramsing
  [28.795784, 94.859209], // Janbo
  [28.753074, 94.897653], // Bomdo
  [28.826674, 94.895337], // Likor
  [28.830000, 94.800000], // Mosing (approx)
  [28.852783, 94.772602], // Miging / Migging
  [28.968627, 94.937656], // Ngaming
  [28.887785, 94.752884], // Pango
  [28.900000, 94.980000], // Ninging (approx)
  [28.933953, 94.826368], // Angging
  [28.940000, 94.850000], // Singging (approx)
  [28.925000, 94.810000], // Resing (approx)
  [28.836530, 94.808875], // Palling
  [28.436273, 95.107728], // Pangkang Kumku
  [28.434147, 95.043929], // Riga
  [28.331100, 95.055957], // Riew
  [28.325827, 95.006730], // Begging
  [28.350995, 95.021651], // Parong Rongku
  [28.371267, 95.059300], // Sitang & Dite Dime
  [28.410000, 94.890000], // Haleng (approx)
  [28.519470, 95.066185], // Pangkang Jorkong
];

const PROX = 0.005;

function isPfr(lat, lng) {
  for (const [plat, plng] of PFR_COORDS) {
    if (Math.hypot(lat - plat, lng - plng) < PROX) return true;
  }
  return false;
}

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// The SHP packs several closely-spaced settlements into single compound
// names ("Tuting Village Purung Old Tuting" is three places at one point).
// Those compound strings produce 30+ char labels that crowd the map. Map
// them to a cleaner short form here — keep the ID and lat/lng unchanged so
// the location still resolves, just the visible label is shortened.
const NAME_OVERRIDE = {
  'Tuting Village Purung Old Tuting': 'Old Tuting',
  'Millang Langdum-Langkong(Silang)': 'Millang Langdum',
  'Riga Mongku Mobuk': 'Riga Mongku',
  'Damro-Boga-Lasing': 'Damro-Boga',
  'Komkar (Buksang)': 'Komkar Buksang',
  'Komkar(Sizer)': 'Komkar Sizer',
  'Komkar(Rasing)': 'Komkar Rasing',
  'Pangkang Kumku Jorkong': 'Pangkang Jorkong',
};
const applyNameOverride = (name) => NAME_OVERRIDE[name] ?? name;

// Tier rank: higher wins on coord-collision.
const TIER_RANK = {
  'district-hq': 4,
  'adc-hq': 3,
  'circle-eac': 2,
  settlement: 1,
};

// `Desc_` values from _important.geojson → tier.
const IMPORTANT_TIER = {
  'District HQ.': 'district-hq',
  ADC: 'adc-hq',
  'Circle HQ.': 'circle-eac',
  EAC: 'circle-eac',
};

// District assignment by actual point-in-polygon against the SHP-derived
// outlines. The lat-threshold heuristic mis-assigned ~12 eastern locations
// (Damro-*, Adi Pasi-*, Padu Tangkum, Siyat Camp, Bomi, etc.) to Siang when
// they actually sit inside Upper Siang's Mariyang sub-division on the east.
const siangPoly = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'public', 'geo', 'district-siang.geojson'), 'utf8'),
).features[0].geometry.coordinates[0];
const upperSiangPoly = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'public', 'geo', 'district-upper-siang.geojson'), 'utf8'),
).features[0].geometry.coordinates[0];

// Standard ray-cast point-in-polygon. ring is [[lng,lat], ...].
function pointInPolygon(lat, lng, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function assignDistrict(_name, lat, lng) {
  // The two polygons border each other but don't overlap. Test both; if a
  // point falls inside neither (rare — e.g. just outside the border due to
  // SHP-precision rounding) fall back to the lat heuristic.
  if (pointInPolygon(lat, lng, upperSiangPoly)) return 'upper-siang';
  if (pointInPolygon(lat, lng, siangPoly)) return 'siang';
  return lat >= 28.475 ? 'upper-siang' : 'siang';
}

// Real-distance dedupe: collapse anything within DEDUPE_PROX (~0.005° ≈ 550 m)
// into a single entry, keeping the higher-ranked tier. Quantised-key hashing
// missed near-neighbours like "Boleng" (district HQ) + "Boleng HQ" (settlement
// at +0.0004 lng) which landed in different buckets despite being the same place.
// 0.005° also collapses Pangin/Pangin HQ/Pangin village (~0.007° spread) and
// Mariyang/Mariyang H.Q. — all the same admin centre shown three ways in the SHP.
const DEDUPE_PROX = 0.005;
const collected = [];

function add(rawName, tier, lat, lng) {
  if (!rawName) return;
  if (isPfr(lat, lng)) return;
  const name = applyNameOverride(rawName);

  for (const row of collected) {
    if (Math.hypot(lat - row.lat, lng - row.lng) < DEDUPE_PROX) {
      // If the incoming row outranks the existing one, take its name/tier.
      // Otherwise leave the existing record alone.
      if (TIER_RANK[tier] > TIER_RANK[row.tier]) {
        row.tier = tier;
        row.name = name;
      }
      return;
    }
  }
  collected.push({
    id: slugify(name) || `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
    name,
    tier,
    district: assignDistrict(name, lat, lng),
    lat,
    lng,
  });
}

// Important features first — their Desc_ classification beats name-sniffing.
for (const f of important.features) {
  const [lng, lat] = f.geometry.coordinates;
  const tier = IMPORTANT_TIER[f.properties.Desc_] || 'settlement';
  add(f.properties.Location, tier, lat, lng);
}

// Then every settlement; promote tier if the name ends with "H.Q." / "HQ".
for (const f of settlements.features) {
  const [lng, lat] = f.geometry.coordinates;
  const raw = f.properties.Name;
  if (!raw) continue;
  const tier = /\b(H\.Q\.?|HQ)\b/i.test(raw) ? 'circle-eac' : 'settlement';
  add(raw, tier, lat, lng);
}

// Make IDs unique — two settlements named "Sitang" would collide otherwise.
const idCounts = new Map();
const list = collected.map((row) => {
  const seen = idCounts.get(row.id) || 0;
  idCounts.set(row.id, seen + 1);
  if (seen === 0) return row;
  return { ...row, id: `${row.id}-${seen + 1}` };
});

list.sort((a, b) => {
  const td = TIER_RANK[b.tier] - TIER_RANK[a.tier];
  if (td) return td;
  return a.name.localeCompare(b.name);
});

const out = [
  '// AUTO-GENERATED by scripts/build-locations.mjs — do not edit by hand.',
  '// Source: scripts/_important.geojson + scripts/_settlement.geojson.',
  '// Re-run when the source shapefiles or the PFR village list change.',
  '//',
  '// Tiers (visual weight, big → small):',
  '//   district-hq  — Yingkiong (Upper Siang), Boleng (Siang)',
  '//   adc-hq       — Tuting, Mariyang, Rumgong',
  '//   circle-eac   — Circle HQs and EAC HQs',
  '//   settlement   — all other inhabited locations from the SHP',
  'import type { District } from "./villages";',
  '',
  "export type LocationTier = 'district-hq' | 'adc-hq' | 'circle-eac' | 'settlement';",
  '',
  'export interface MapLocation {',
  '  id: string;',
  '  name: string;',
  '  tier: LocationTier;',
  '  district: District;',
  '  lat: number;',
  '  lng: number;',
  '}',
  '',
  'export const mapLocations: MapLocation[] = [',
  ...list.map(
    (l) =>
      `  { id: ${JSON.stringify(l.id)}, name: ${JSON.stringify(l.name)}, tier: '${l.tier}', district: '${l.district}', lat: ${l.lat.toFixed(6)}, lng: ${l.lng.toFixed(6)} },`,
  ),
  '];',
  '',
];

const outPath = path.join(__dirname, '..', 'src', 'data', 'locations.ts');
writeFileSync(outPath, out.join('\n'));

const tally = (t) => list.filter((l) => l.tier === t).length;
const byDist = (d) => list.filter((l) => l.district === d).length;
console.log(`Wrote ${list.length} non-PFR locations → ${path.relative(process.cwd(), outPath)}`);
console.log(`  district-hq: ${tally('district-hq')}`);
console.log(`  adc-hq:      ${tally('adc-hq')}`);
console.log(`  circle-eac:  ${tally('circle-eac')}`);
console.log(`  settlement:  ${tally('settlement')}`);
console.log(`  siang:       ${byDist('siang')}`);
console.log(`  upper-siang: ${byDist('upper-siang')}`);
