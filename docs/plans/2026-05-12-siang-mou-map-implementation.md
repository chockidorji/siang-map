# Siang MoU Map — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a two-page (Siang / Upper Siang) interactive React + Leaflet web presentation that pins 25 MoU villages on the supplied district shapefiles, with always-visible name chips and an on-hover MoU Status Card tooltip.

**Architecture:** Vite + React + TypeScript + Tailwind static SPA. Leaflet renders GeoJSON layers (district boundary, drainage, rivers) on a plain white canvas with no basemap tiles. Village pins are custom `divIcon` markers. One React state variable (`selectedDistrict`) drives the entire page. Shapefile → GeoJSON conversion is a one-time dev-time step using the `mapshaper` CLI.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind CSS v4, Leaflet 1.9, react-leaflet 4, mapshaper (dev-only).

**Project root:** `/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map/`

**Design doc:** [`docs/plans/2026-05-12-siang-mou-map-design.md`](2026-05-12-siang-mou-map-design.md)

---

## Phase 1 — Project scaffold

### Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `siang-mou-map/` (full Vite scaffold)

**Step 1: Run Vite scaffold**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS"
npm create vite@latest siang-mou-map -- --template react-ts
```

Expected: Vite creates `siang-mou-map/` with `src/`, `package.json`, etc. No prompts because `--template` is provided.

**Step 2: Install scaffold dependencies**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map"
npm install
```

Expected: `node_modules/` created, no errors.

**Step 3: Verify dev server runs**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map"
npm run dev
```

Expected: Vite prints `Local: http://localhost:5173/`. Open it in a browser — see the default Vite + React landing page. Stop the server with Ctrl+C.

**Step 4: Commit**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS"
# .gitignore is created by Vite — we should also ignore node_modules at the repo level
echo "siang-mou-map/node_modules/" > .gitignore
git add .gitignore siang-mou-map/
git commit -m "feat: scaffold Vite + React + TS project"
```

---

### Task 2: Install runtime dependencies (Leaflet + react-leaflet)

**Files:**
- Modify: `siang-mou-map/package.json`

**Step 1: Install**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map"
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

Expected: 3 packages added.

**Step 2: Verify versions**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map"
node -e "const p = require('./package.json'); console.log(JSON.stringify({leaflet: p.dependencies.leaflet, 'react-leaflet': p.dependencies['react-leaflet']}, null, 2))"
```

Expected: Both versions show. `react-leaflet` should be `^4.x` (compatible with React 18).

**Step 3: Commit**

```bash
git add siang-mou-map/package.json siang-mou-map/package-lock.json
git commit -m "feat: add leaflet + react-leaflet"
```

---

### Task 3: Install and configure Tailwind CSS v4

**Files:**
- Modify: `siang-mou-map/package.json`
- Modify: `siang-mou-map/vite.config.ts`
- Modify: `siang-mou-map/src/index.css`

**Step 1: Install Tailwind v4 with Vite plugin**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map"
npm install -D tailwindcss @tailwindcss/vite
```

**Step 2: Wire Tailwind into Vite config**

Edit `siang-mou-map/vite.config.ts` to:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**Step 3: Replace `src/index.css` contents with**

```css
@import "tailwindcss";

:root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

html, body, #root {
  height: 100%;
  margin: 0;
}

body {
  background: #FAFAFA;
  color: #111827;
  -webkit-font-smoothing: antialiased;
}
```

**Step 4: Add Inter font to `index.html`**

In `siang-mou-map/index.html`, inside `<head>`, add **before** the `<link rel="icon">` line:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<title>Status of MoU — Siang & Upper Siang Districts</title>
```

(Replace the existing `<title>` line with the one above.)

**Step 5: Strip default App template** — replace `siang-mou-map/src/App.tsx` with:

```tsx
export default function App() {
  return (
    <div className="h-full flex items-center justify-center text-2xl font-semibold">
      Tailwind is working.
    </div>
  );
}
```

Also delete `siang-mou-map/src/App.css` (no longer needed):

```bash
rm "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map/src/App.css"
```

**Step 6: Verify**

```bash
npm run dev
```

Expected: Browser shows centered "Tailwind is working." in a large bold font.

**Step 7: Commit**

```bash
git add siang-mou-map/
git commit -m "feat: add Tailwind v4 + Inter font"
```

---

## Phase 2 — Data prep

### Task 4: Convert shapefiles to GeoJSON

**Files:**
- Create: `siang-mou-map/public/geo/district-siang.geojson`
- Create: `siang-mou-map/public/geo/district-upper-siang.geojson`
- Create: `siang-mou-map/public/geo/drainage-siang.geojson`
- Create: `siang-mou-map/public/geo/drainage-upper-siang.geojson`
- Create: `siang-mou-map/public/geo/rivers-siang.geojson`
- Create: `siang-mou-map/public/geo/rivers-upper-siang.geojson`

**Step 1: Make the output directory**

```bash
mkdir -p "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map/public/geo"
```

**Step 2: Convert district boundaries (combined file → split by attribute)**

The source `UPPERSIANG_SIANG_DISTRICT_BOUNDARY.shp` contains both districts (`Dist_name` = "UPPER SIANG" or "SIANG"). Use mapshaper to reproject to WGS84 and split by that attribute.

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS"
npx -y mapshaper "UPPER SIANG AND SIANG SHAPEFILE/UPPERSIANG_SIANG_DISTRICT_BOUNDARY.shp" \
  -proj wgs84 \
  -filter '"SIANG" === Dist_name' \
  -o "siang-mou-map/public/geo/district-siang.geojson" format=geojson

npx -y mapshaper "UPPER SIANG AND SIANG SHAPEFILE/UPPERSIANG_SIANG_DISTRICT_BOUNDARY.shp" \
  -proj wgs84 \
  -filter '"UPPER SIANG" === Dist_name' \
  -o "siang-mou-map/public/geo/district-upper-siang.geojson" format=geojson
```

Expected: Two GeoJSON files created. Each ~50–200 KB.

**Step 3: Convert drainage and rivers**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS"
npx -y mapshaper "UPPER SIANG AND SIANG SHAPEFILE/DRAINAGE_SIANG.shp" \
  -proj wgs84 \
  -o "siang-mou-map/public/geo/drainage-siang.geojson" format=geojson

npx -y mapshaper "UPPER SIANG AND SIANG SHAPEFILE/DRAINAGE_UPPERSIANG.shp" \
  -proj wgs84 \
  -o "siang-mou-map/public/geo/drainage-upper-siang.geojson" format=geojson

npx -y mapshaper "UPPER SIANG AND SIANG SHAPEFILE/RIVER_SIANG.shp" \
  -proj wgs84 \
  -o "siang-mou-map/public/geo/rivers-siang.geojson" format=geojson

npx -y mapshaper "UPPER SIANG AND SIANG SHAPEFILE/RIVER_UPPER_SIANG.shp" \
  -proj wgs84 \
  -o "siang-mou-map/public/geo/rivers-upper-siang.geojson" format=geojson
```

**Step 4: Sanity-check the output**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map/public/geo"
ls -lh *.geojson
node -e "const d = require('./district-siang.geojson'); const coords = d.features[0].geometry.coordinates; let pt = coords; while(Array.isArray(pt[0])) pt = pt[0]; console.log('First point:', pt);"
```

Expected: All 6 files present. First-point output shows **longitude ~94.6–95.4** and **latitude ~28.3–29.0** (NOT large UTM numbers like 500000+).

If you see large numbers, the reprojection didn't happen — recheck the `-proj wgs84` flag.

**Step 5: Commit**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS"
git add siang-mou-map/public/geo/
git commit -m "feat: convert shapefiles to GeoJSON (WGS84)"
```

---

### Task 5: Extract village coordinates from SETTLEMENT.shp

**Files:**
- Create: `siang-mou-map/scripts/extract-coords.mjs`

**Step 1: Convert SETTLEMENT.shp to GeoJSON (temporary, for parsing)**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS"
mkdir -p siang-mou-map/scripts
npx -y mapshaper "UPPER SIANG AND SIANG SHAPEFILE/SETTLEMENT.shp" \
  -proj wgs84 \
  -o "siang-mou-map/scripts/_settlement.geojson" format=geojson

npx -y mapshaper "UPPER SIANG AND SIANG SHAPEFILE/IMPORTANT_LOCATION.shp" \
  -proj wgs84 \
  -o "siang-mou-map/scripts/_important.geojson" format=geojson
```

**Step 2: Write the extraction script**

Create `siang-mou-map/scripts/extract-coords.mjs`:

```js
import fs from 'fs';

const settlements = JSON.parse(fs.readFileSync('./scripts/_settlement.geojson', 'utf-8'));
const important   = JSON.parse(fs.readFileSync('./scripts/_important.geojson', 'utf-8'));

// MOU villages to look up
const TARGETS = [
  // Upper Siang
  ['Komkar', ['Komkar']],
  ['Karko', ['Karko']],
  ['Simong', ['Simong']],
  ['Pugging', ['Pugging']],
  ['Ramsing', ['Ramsing']],
  ['Janbo', ['Janbo']],
  ['Bomdo', ['Bomdo']],
  ['Likor', ['Likor']],
  ['Mosing', ['Mosing']],
  ['Miging', ['Miging', 'Migging']],
  ['Ngaming', ['Ngaming']],
  ['Pango', ['Pango']],
  ['Ninging', ['Ninging']],
  ['Angging', ['Angging']],
  ['Singging', ['Singging']],
  ['Resing', ['Resing']],
  ['Palling', ['Palling']],
  // Siang
  ['Pangkang Kumku', ['Kumku', 'Pangkang Kumku', 'Pangkang Kumku Jorkong']],
  ['Riga', ['Riga']],
  ['Riew', ['Riew']],
  ['Begging', ['Begging', 'Beging']],
  ['Parong Rongku', ['Parong']],
  ['Sitang', ['Sitang']],
  ['Dite Dime', ['Dite Dime']],
  ['Haleng', ['Haleng']],
  ['Pangkang Jorkong', ['Pangkang Jorkong', 'Pangkang Kumku Jorkong', 'Kumku']],
];

const allPoints = [
  ...settlements.features.map(f => ({ name: f.properties.Name || '', coord: f.geometry.coordinates, src: 'SETTLEMENT' })),
  ...important.features.map(f => ({ name: f.properties.Location || '', coord: f.geometry.coordinates, src: 'IMPORTANT' })),
];

function findCoord(aliases) {
  for (const alias of aliases) {
    const exact = allPoints.find(p => p.name.toLowerCase() === alias.toLowerCase());
    if (exact) return { ...exact, matched: alias, method: 'exact' };
    const startsWith = allPoints.find(p => p.name.toLowerCase().startsWith(alias.toLowerCase()));
    if (startsWith) return { ...startsWith, matched: alias, method: 'startsWith' };
    const includes = allPoints.find(p => p.name.toLowerCase().includes(alias.toLowerCase()));
    if (includes) return { ...includes, matched: alias, method: 'includes' };
  }
  return null;
}

for (const [village, aliases] of TARGETS) {
  const hit = findCoord(aliases);
  if (hit) {
    const [lng, lat] = hit.coord;
    console.log(`${village.padEnd(22)} | ${hit.matched.padEnd(28)} | ${hit.src.padEnd(10)} | ${hit.method.padEnd(10)} | ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  } else {
    console.log(`${village.padEnd(22)} | --- NO MATCH ---`);
  }
}
```

**Step 3: Run extraction**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map"
node scripts/extract-coords.mjs > scripts/coords-report.txt
cat scripts/coords-report.txt
```

Expected: ~19 of 25 villages get a match (`lat, lng` printed). Unmatched ones print `--- NO MATCH ---`. Save the report — it's the source of truth for Task 6.

**Step 4: Commit (script + report)**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS"
git add siang-mou-map/scripts/
git commit -m "feat: village coordinate extraction script + report"
```

---

### Task 6: Build the village dataset (`villages.ts`)

**Files:**
- Create: `siang-mou-map/src/data/villages.ts`

**Step 1: Read `scripts/coords-report.txt`** and copy the lat/lng of every matched village into the dataset below.

**Step 2: For unmatched villages**, eyeball coordinates from `SIANG PINNED MAPS.pdf` (open it manually). Reference points (district HQs, all WGS84 lat/lng):
- **Yingkiong** (Upper Siang HQ): 28.652, 95.012
- **Boleng** (Siang HQ): 28.389, 94.919
- **Pangin**: 28.082, 94.969

Place each unmatched village roughly between its known neighbors, using rivers in the PDF as guides. Mark `isApproximate: true`.

**Step 3: Create `siang-mou-map/src/data/villages.ts`**

```ts
export type District = 'siang' | 'upper-siang';

export interface MouData {
  signedOn: string;          // e.g., "30th December 2025"
  households: number;
  agreedForPFR: number;
  percentAgreed: number | null;  // null when source data is inconsistent
}

export interface Village {
  id: string;
  name: string;
  district: District;
  lat: number;
  lng: number;
  isApproximate: boolean;
  mou: MouData;
}

// ============================================================
// IMPORTANT: lat/lng values below are PLACEHOLDERS.
// Replace them with actual coordinates from
// `siang-mou-map/scripts/coords-report.txt` (for matched villages)
// and from `SIANG PINNED MAPS.pdf` (for approximate villages).
// ============================================================

export const villages: Village[] = [
  // ---------- Upper Siang District (17) ----------
  { id: 'komkar',   name: 'Komkar',   district: 'upper-siang', lat: 28.71, lng: 95.02, isApproximate: false,
    mou: { signedOn: '30th December 2025', households: 262, agreedForPFR: 257, percentAgreed: 98.1 } },
  { id: 'karko',    name: 'Karko',    district: 'upper-siang', lat: 28.69, lng: 95.05, isApproximate: false,
    mou: { signedOn: '1st February 2026', households: 138, agreedForPFR: 105, percentAgreed: 76.1 } },
  { id: 'simong',   name: 'Simong',   district: 'upper-siang', lat: 28.70, lng: 95.07, isApproximate: false,
    mou: { signedOn: '26th February 2026', households: 240, agreedForPFR: 199, percentAgreed: 82.9 } },
  { id: 'pugging',  name: 'Pugging',  district: 'upper-siang', lat: 28.74, lng: 95.05, isApproximate: false,
    mou: { signedOn: '15th March 2026', households: 72, agreedForPFR: 68, percentAgreed: 94.4 } },
  { id: 'ramsing',  name: 'Ramsing',  district: 'upper-siang', lat: 28.73, lng: 95.08, isApproximate: false,
    mou: { signedOn: '15th March 2026', households: 83, agreedForPFR: 17, percentAgreed: 20.5 } },
  { id: 'janbo',    name: 'Janbo',    district: 'upper-siang', lat: 28.71, lng: 95.10, isApproximate: false,
    mou: { signedOn: '15th March 2026', households: 59, agreedForPFR: 30, percentAgreed: 50.8 } },
  { id: 'bomdo',    name: 'Bomdo',    district: 'upper-siang', lat: 28.75, lng: 95.07, isApproximate: false,
    mou: { signedOn: '16th March 2026', households: 83, agreedForPFR: 76, percentAgreed: 91.6 } },
  { id: 'likor',    name: 'Likor',    district: 'upper-siang', lat: 28.76, lng: 95.03, isApproximate: false,
    mou: { signedOn: '19th March 2026', households: 134, agreedForPFR: 134, percentAgreed: 100.0 } },
  { id: 'mosing',   name: 'Mosing',   district: 'upper-siang', lat: 28.68, lng: 95.02, isApproximate: true,
    mou: { signedOn: '6th May 2026', households: 53, agreedForPFR: 45, percentAgreed: 84.9 } },
  { id: 'miging',   name: 'Miging',   district: 'upper-siang', lat: 28.69, lng: 95.03, isApproximate: false,
    mou: { signedOn: '6th May 2026', households: 69, agreedForPFR: 50, percentAgreed: 72.5 } },
  { id: 'ngaming',  name: 'Ngaming',  district: 'upper-siang', lat: 28.66, lng: 95.04, isApproximate: false,
    mou: { signedOn: '6th May 2026', households: 74, agreedForPFR: 67, percentAgreed: 90.5 } },
  { id: 'pango',    name: 'Pango',    district: 'upper-siang', lat: 28.65, lng: 95.06, isApproximate: false,
    mou: { signedOn: '6th May 2026', households: 56, agreedForPFR: 39, percentAgreed: 69.6 } },
  { id: 'ninging',  name: 'Ninging',  district: 'upper-siang', lat: 28.63, lng: 95.07, isApproximate: true,
    mou: { signedOn: '7th May 2026', households: 58, agreedForPFR: 39, percentAgreed: 67.2 } },
  { id: 'angging',  name: 'Angging',  district: 'upper-siang', lat: 28.61, lng: 95.05, isApproximate: false,
    mou: { signedOn: '7th May 2026', households: 5, agreedForPFR: 22, percentAgreed: null } },
  { id: 'singging', name: 'Singging', district: 'upper-siang', lat: 28.60, lng: 95.07, isApproximate: true,
    mou: { signedOn: '7th May 2026', households: 21, agreedForPFR: 25, percentAgreed: null } },
  { id: 'resing',   name: 'Resing',   district: 'upper-siang', lat: 28.62, lng: 95.09, isApproximate: true,
    mou: { signedOn: '7th May 2026', households: 36, agreedForPFR: 45, percentAgreed: null } },
  { id: 'palling',  name: 'Palling',  district: 'upper-siang', lat: 28.78, lng: 94.99, isApproximate: false,
    mou: { signedOn: '8th May 2026', households: 30, agreedForPFR: 26, percentAgreed: 86.7 } },

  // ---------- Siang District (8) ----------
  { id: 'pangkang-kumku',   name: 'Pangkang Kumku',     district: 'siang', lat: 28.39, lng: 94.87, isApproximate: false,
    mou: { signedOn: '23rd May 2025', households: 80, agreedForPFR: 46, percentAgreed: 57.5 } },
  { id: 'riga',             name: 'Riga',               district: 'siang', lat: 28.30, lng: 94.93, isApproximate: false,
    mou: { signedOn: '11th July 2025', households: 422, agreedForPFR: 306, percentAgreed: 72.5 } },
  { id: 'riew',             name: 'Riew',               district: 'siang', lat: 28.42, lng: 94.93, isApproximate: false,
    mou: { signedOn: '25th July 2025', households: 157, agreedForPFR: 114, percentAgreed: 72.6 } },
  { id: 'begging',          name: 'Begging',            district: 'siang', lat: 28.38, lng: 94.91, isApproximate: false,
    mou: { signedOn: '19th August 2025', households: 42, agreedForPFR: 36, percentAgreed: 85.7 } },
  { id: 'parong-rongku',    name: 'Parong Rongku',      district: 'siang', lat: 28.36, lng: 94.95, isApproximate: false,
    mou: { signedOn: '20th September 2025', households: 108, agreedForPFR: 74, percentAgreed: 68.5 } },
  { id: 'sitang-dite-dime', name: 'Sitang & Dite Dime', district: 'siang', lat: 28.33, lng: 94.97, isApproximate: false,
    mou: { signedOn: '21st February 2026', households: 84, agreedForPFR: 59, percentAgreed: 70.2 } },
  { id: 'haleng',           name: 'Haleng',             district: 'siang', lat: 28.41, lng: 94.89, isApproximate: true,
    mou: { signedOn: '26th February 2026', households: 8, agreedForPFR: 8, percentAgreed: 100.0 } },
  { id: 'pangkang-jorkong', name: 'Pangkang Jorkong',   district: 'siang', lat: 28.40, lng: 94.88, isApproximate: false,
    mou: { signedOn: '3rd March 2026', households: 86, agreedForPFR: 74, percentAgreed: 86.0 } },
];

// District bounding boxes for Leaflet flyToBounds
// [southWest, northEast] in [lat, lng]
export const DISTRICT_BOUNDS: Record<District, [[number, number], [number, number]]> = {
  'siang':       [[28.05, 94.60], [28.55, 95.10]],
  'upper-siang': [[28.40, 94.70], [29.30, 95.50]],
};
```

**Step 4: Commit (placeholder data — will refine in Task 7)**

```bash
git add siang-mou-map/src/data/villages.ts
git commit -m "feat: village dataset (placeholder coords)"
```

---

### Task 7: Replace placeholder coordinates with real ones

**Files:**
- Modify: `siang-mou-map/src/data/villages.ts`

**Step 1:** Open `siang-mou-map/scripts/coords-report.txt`. For every matched village, replace the placeholder `lat` and `lng` in `villages.ts` with the actual values.

**Step 2:** For the ~6 unmatched villages, open `SIANG PINNED MAPS.pdf`. Zoom into each one. Eyeball its position relative to the river and named neighbors. Update lat/lng in `villages.ts` and confirm `isApproximate: true`.

**Step 3:** Update `DISTRICT_BOUNDS` in `villages.ts` to actually contain all pins for each district (compute min/max lat/lng from final coords).

**Step 4: Commit**

```bash
git add siang-mou-map/src/data/villages.ts
git commit -m "feat: replace placeholder village coords with real values"
```

---

## Phase 3 — Components

### Task 8: Header component

**Files:**
- Create: `siang-mou-map/src/components/Header.tsx`

**Step 1: Create the file**

```tsx
export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white px-8 py-4">
      <h1 className="text-[22px] font-semibold tracking-tight text-gray-900">
        Status of MoU — Infrastructure Project
      </h1>
      <p className="text-sm text-gray-500">
        Siang & Upper Siang Districts
      </p>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add siang-mou-map/src/components/Header.tsx
git commit -m "feat: add Header component"
```

---

### Task 9: TopNav component

**Files:**
- Create: `siang-mou-map/src/components/TopNav.tsx`

**Step 1: Create the file**

```tsx
import type { District } from '../data/villages';

interface Props {
  value: District;
  onChange: (v: District) => void;
}

const TABS: Array<{ id: District; label: string }> = [
  { id: 'siang',       label: 'Siang District' },
  { id: 'upper-siang', label: 'Upper Siang District' },
];

export default function TopNav({ value, onChange }: Props) {
  return (
    <nav className="flex items-center gap-8 border-b border-gray-200 bg-white px-8">
      {TABS.map(tab => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative py-3 text-sm transition-colors ${
              active
                ? 'font-bold text-gray-900'
                : 'font-medium text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-black" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
```

**Step 2: Commit**

```bash
git add siang-mou-map/src/components/TopNav.tsx
git commit -m "feat: add TopNav district switcher"
```

---

### Task 10: VillagePin component (custom Leaflet divIcon)

**Files:**
- Create: `siang-mou-map/src/components/VillagePin.tsx`

**Step 1: Create the file**

```tsx
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { Village } from '../data/villages';

interface Props {
  village: Village;
  onHover: (village: Village | null, event?: L.LeafletMouseEvent) => void;
}

function buildIcon(village: Village): L.DivIcon {
  const is100 = village.mou.percentAgreed === 100;
  const dotClasses = village.isApproximate
    ? 'border-[2px] border-dashed border-red-600 bg-white'
    : 'bg-red-600 border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]';
  const star = is100
    ? '<span class="absolute -top-2 -right-2 text-amber-500 text-[14px] leading-none">★</span>'
    : '';

  return L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `
      <div class="relative" style="width:16px;height:16px;">
        <div class="absolute inset-0 rounded-full ${dotClasses}"></div>
        ${star}
        <div class="absolute left-1/2 top-[20px] -translate-x-1/2 whitespace-nowrap
                    rounded-md bg-white px-2 py-[2px] text-[11px] font-medium text-gray-900
                    shadow-[0_1px_2px_rgba(0,0,0,0.15)] border border-gray-200">
          ${village.name}
        </div>
      </div>
    `,
  });
}

export default function VillagePin({ village, onHover }: Props) {
  return (
    <Marker
      position={[village.lat, village.lng]}
      icon={buildIcon(village)}
      eventHandlers={{
        mouseover: (e) => onHover(village, e),
        mouseout: () => onHover(null),
      }}
    />
  );
}
```

**Step 2: Commit**

```bash
git add siang-mou-map/src/components/VillagePin.tsx
git commit -m "feat: add VillagePin custom divIcon marker"
```

---

### Task 11: VillageTooltip component

**Files:**
- Create: `siang-mou-map/src/components/VillageTooltip.tsx`

**Step 1: Create the file**

```tsx
import type { Village } from '../data/villages';

interface Props {
  village: Village;
  /** Pixel position of the pin, relative to the map container */
  x: number;
  y: number;
}

function formatDate(raw: string): string {
  // Source already pretty: "30th December 2025" — pass through
  return raw;
}

export default function VillageTooltip({ village, x, y }: Props) {
  const { mou } = village;
  // Position card top-right of pin (with offset). Right-edge flip handled by parent if needed.
  const style: React.CSSProperties = {
    transform: `translate(${x + 14}px, ${y - 90}px)`,
  };

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-[1000] w-[300px]
                 animate-[fadeIn_150ms_ease-out]"
      style={style}
    >
      <div className="rounded-sm border-[1.5px] border-black bg-white p-4 shadow-md">
        <h3 className="mb-3 text-center text-[16px] font-bold text-gray-900">
          {village.name}
        </h3>
        <dl className="space-y-2 text-[13px] text-gray-900">
          <div className="flex items-baseline justify-between gap-4">
            <dt>MoU signed on</dt>
            <dd className="text-right">{formatDate(mou.signedOn)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt>No. of Households</dt>
            <dd>{mou.households}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt>No. of Households agreed for PFR</dt>
            <dd>{mou.agreedForPFR}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4 px-4 text-[14px] font-bold text-gray-900">
        <span>% of Households Agreed for PFR</span>
        <span>{mou.percentAgreed === null ? '—' : `${mou.percentAgreed.toFixed(1)}%`}</span>
      </div>
      {village.isApproximate && (
        <p className="mt-1 px-4 text-[10px] italic text-gray-500">Location approximated</p>
      )}
    </div>
  );
}
```

**Step 2: Add the `fadeIn` keyframe to `src/index.css`** (append at the end):

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Step 3: Commit**

```bash
git add siang-mou-map/src/components/VillageTooltip.tsx siang-mou-map/src/index.css
git commit -m "feat: add VillageTooltip MoU Status Card"
```

---

### Task 12: DistrictMap component

**Files:**
- Create: `siang-mou-map/src/components/DistrictMap.tsx`

**Step 1: Create the file**

```tsx
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
```

**Step 2: Commit**

```bash
git add siang-mou-map/src/components/DistrictMap.tsx
git commit -m "feat: add DistrictMap (Leaflet + GeoJSON layers + pins)"
```

---

### Task 13: Wire it all together in App.tsx

**Files:**
- Modify: `siang-mou-map/src/App.tsx`

**Step 1: Replace `src/App.tsx`**

```tsx
import { useState } from 'react';
import Header from './components/Header';
import TopNav from './components/TopNav';
import DistrictMap from './components/DistrictMap';
import type { District } from './data/villages';

export default function App() {
  const [district, setDistrict] = useState<District>('siang');

  return (
    <div className="flex h-full flex-col">
      <Header />
      <TopNav value={district} onChange={setDistrict} />
      <main className="relative flex-1">
        <DistrictMap district={district} />
      </main>
    </div>
  );
}
```

**Step 2: Verify in browser**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map"
npm run dev
```

Open `http://localhost:5173`. Expected:
- Header bar at top
- Two tabs ("Siang District" active by default)
- Below, a map showing the Siang district outline + drainage + rivers + 8 red pins with white name chips
- Hovering Riga / Haleng / etc. shows the MoU Status Card matching the screenshot
- Clicking "Upper Siang District" tab smoothly flies the map to Upper Siang and shows its 17 pins

**Step 3: Commit**

```bash
git add siang-mou-map/src/App.tsx
git commit -m "feat: wire up App with Header + TopNav + DistrictMap"
```

---

## Phase 4 — Verification & ship

### Task 14: Data integrity check

**Files:**
- Create: `siang-mou-map/scripts/verify-data.mjs`

**Step 1: Create the file**

```js
import { villages, DISTRICT_BOUNDS } from '../src/data/villages.ts';
// NOTE: this script is meant to be run with `node --experimental-strip-types`
// or you can convert it to .js by inlining the import after build.

const errors = [];

if (villages.length !== 25) {
  errors.push(`Expected 25 villages, found ${villages.length}`);
}

const siangCount = villages.filter(v => v.district === 'siang').length;
const upperCount = villages.filter(v => v.district === 'upper-siang').length;
if (siangCount !== 8)  errors.push(`Expected 8 Siang villages, found ${siangCount}`);
if (upperCount !== 17) errors.push(`Expected 17 Upper Siang villages, found ${upperCount}`);

for (const v of villages) {
  const [[swLat, swLng], [neLat, neLng]] = DISTRICT_BOUNDS[v.district];
  if (v.lat < swLat || v.lat > neLat || v.lng < swLng || v.lng > neLng) {
    errors.push(`${v.name}: coords (${v.lat}, ${v.lng}) outside ${v.district} bbox`);
  }
  if (v.mou.percentAgreed !== null) {
    const computed = (v.mou.agreedForPFR / v.mou.households) * 100;
    const stored = v.mou.percentAgreed;
    if (Math.abs(computed - stored) > 0.15) {
      errors.push(`${v.name}: percent mismatch — stored ${stored}, computed ${computed.toFixed(1)}`);
    }
  }
}

if (errors.length) {
  console.error('❌ Data integrity FAILED:');
  errors.forEach(e => console.error('  -', e));
  process.exit(1);
} else {
  console.log(`✅ All 25 villages valid (${siangCount} Siang, ${upperCount} Upper Siang)`);
}
```

**Step 2: Run it**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map"
node --experimental-strip-types scripts/verify-data.mjs
```

Expected: `✅ All 25 villages valid (8 Siang, 17 Upper Siang)`. If errors print, fix the coord/percent issues in `villages.ts`.

(If your Node version is < 22.7, swap the import for a small inline copy of the validation logic — the script's purpose is the assertions, not the import path.)

**Step 3: Commit**

```bash
git add siang-mou-map/scripts/verify-data.mjs
git commit -m "feat: add data integrity check script"
```

---

### Task 15: Visual smoke check (manual)

**Step 1: Start dev server**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map"
npm run dev
```

**Step 2: Walk through this checklist in the browser:**

- [ ] Siang tab is active by default
- [ ] District outline visible, fully enclosed (no gaps)
- [ ] Rivers render in deep blue, drainage in pale blue
- [ ] All 8 Siang pins visible: Pangkang Kumku, Riga, Riew, Begging, Parong Rongku, Sitang & Dite Dime, Haleng, Pangkang Jorkong
- [ ] Haleng has a gold ⭐ corner badge (100%)
- [ ] Hover over Riga → tooltip shows: "11th July 2025 / 422 / 306 / 72.5%"
- [ ] Hover over Haleng → tooltip shows: "26th February 2026 / 8 / 8 / 100.0%"
- [ ] Mouse out → tooltip disappears smoothly
- [ ] Click "Upper Siang District" → map flies, shows 17 pins
- [ ] Likor pin has gold ⭐ badge (100%)
- [ ] Hover Komkar → tooltip shows: "30th December 2025 / 262 / 257 / 98.1%"
- [ ] Hover Ramsing → tooltip shows: "15th March 2026 / 83 / 17 / 20.5%"
- [ ] Hover an approximate-coord pin (e.g., Mosing) → pin appears as hollow dashed ring, tooltip shows "Location approximated" footer
- [ ] Hover Angging/Singging/Resing → tooltip shows "—" instead of % (because source data inconsistent)
- [ ] No console errors in DevTools

**Step 3: Fix any issues, commit.** If everything passes, no commit needed.

---

### Task 16: Production build + preview

**Files:** none

**Step 1: Build**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map"
npm run build
```

Expected: `dist/` folder created. Build output summary should show JS chunks ≤ 500 KB.

**Step 2: Preview production build**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map"
npm run preview
```

Open the URL it prints. Re-run the visual checklist from Task 15 in this build.

**Step 3: Verify dist contents**

```bash
ls -la "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map/dist/"
ls -la "/Users/chockeydorjee/Downloads/SIANG MAPS/siang-mou-map/dist/geo/"
```

Expected: `index.html`, `assets/`, `geo/` (with all 6 GeoJSON files) all present.

**Step 4: Commit (build artifact ignored, but lockfile state should be clean)**

```bash
cd "/Users/chockeydorjee/Downloads/SIANG MAPS"
git status
```

Expected: clean working tree (dist/ is gitignored by default).

---

## Done

The `dist/` folder is the final deliverable:
- Double-click `dist/index.html` → opens locally
- OR upload `dist/` contents to Hostinger (use the `deploy` skill if/when ready)
- OR keep in dev mode for ongoing edits

**Total tasks:** 16
**Estimated build time:** 2–3 hours end-to-end (mostly Task 5–7: coordinate sourcing)
