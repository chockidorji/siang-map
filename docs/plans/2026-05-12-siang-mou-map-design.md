# Status of MoU — Siang & Upper Siang Districts: Interactive Map Design

**Date:** 2026-05-12
**Author:** Chocki Technologies (with Claude Code)
**Status:** Approved for implementation

---

## 1. Goal

A two-page interactive web presentation titled **"Status of MoU: Infrastructure Project – Siang & Upper Siang Districts"** that displays each MOU village as a pin on a map of its district. Hovering a pin reveals an MoU Status Card with signing date, household counts, and percent agreement for PFR (Prior Free Right).

Audience: government stakeholders viewing the presentation on a large screen / projector.

## 2. Scope

**In scope**
- Two-tab top-navigation web app (Siang District / Upper Siang District)
- 25 village pins (17 Upper Siang + 8 Siang) plotted on real geographic district maps
- Always-visible village name chips next to each pin
- Hover tooltip showing MoU date, total households, agreed households, percent agreed
- District boundary, drainage, and river layers rendered from the supplied shapefile bundle
- Static build (`dist/` folder) deployable to any static host or runnable locally
- Designed for desktop / projector (≥ 1366 px wide)

**Out of scope (YAGNI)**
- Mobile / tablet responsive layout
- Legend, summary cards, search/filter, export buttons
- Backend, auth, analytics
- Unit / integration tests (verification is visual)
- Data editing UI (data is a static snapshot from `Status of MOU 1.docx`)

## 3. Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Build | Vite + React 18 + TypeScript | Fast dev, tiny static output, types catch village-name typos |
| Map engine | Leaflet 1.9 via `react-leaflet` v4 | Free, no API token, supports tile-less canvas, easy GeoJSON overlay |
| Styling | Tailwind CSS | Matches "modern minimalist SaaS" cue, no separate CSS files |
| State | React `useState` | Only one selector (`selectedDistrict`); no router or store needed |
| Shapefile conversion | Node script (`shapefile` + `proj4`) | One-time, reprojects UTM 46N → WGS84, outputs GeoJSON committed to repo |

## 4. Architecture

```
siang-mou-map/
├── public/
│   └── geo/                       # pre-converted GeoJSON files
│       ├── district-siang.geojson
│       ├── district-upper-siang.geojson
│       ├── drainage-siang.geojson
│       ├── drainage-upper-siang.geojson
│       ├── rivers-siang.geojson
│       └── rivers-upper-siang.geojson
├── src/
│   ├── data/
│   │   └── villages.ts            # 25 villages with lat/lng + MoU data
│   ├── components/
│   │   ├── DistrictMap.tsx        # Leaflet map + layers + pins
│   │   ├── VillagePin.tsx         # Custom divIcon (marker + label chip)
│   │   ├── VillageTooltip.tsx     # Floating MoU Status Card
│   │   ├── TopNav.tsx             # District tab switcher
│   │   └── Header.tsx             # Title bar
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   └── shp-to-geojson.mjs         # One-time data prep (dev only)
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## 5. Data pipeline

### 5.1 Shapefile conversion (one-time, before app code)

`scripts/shp-to-geojson.mjs` reads these five shapefiles, reprojects from **UTM Zone 46N → WGS84** using `proj4`, and writes six GeoJSON files (splitting the combined district file into two):

1. `UPPERSIANG_SIANG_DISTRICT_BOUNDARY.shp` → `district-siang.geojson` + `district-upper-siang.geojson`
2. `DRAINAGE_SIANG.shp` → `drainage-siang.geojson`
3. `DRAINAGE_UPPERSIANG.shp` → `drainage-upper-siang.geojson`
4. `RIVER_SIANG.shp` → `rivers-siang.geojson`
5. `RIVER_UPPER_SIANG.shp` → `rivers-upper-siang.geojson`

Output committed under `public/geo/`. Browser never loads raw shapefile binaries.

### 5.2 Village dataset (`src/data/villages.ts`)

TypeScript array of 25 entries. Each entry shape:

```ts
interface Village {
  id: string;
  name: string;
  district: 'siang' | 'upper-siang';
  lat: number;
  lng: number;
  isApproximate: boolean;
  mou: {
    signedOn: string;          // e.g., "30th December 2025"
    households: number;
    agreedForPFR: number;
    percentAgreed: number;     // e.g., 98.1
  };
}
```

### 5.3 Village data (from `Status of MOU 1.docx`, authoritative)

**Upper Siang District (17 villages)**

| # | Village | MoU date | Households | Agreed | % |
|---|---|---|---|---|---|
| 1 | Komkar | 30 Dec 2025 | 262 | 257 | 98.1 |
| 2 | Karko | 1 Feb 2026 | 138 | 105 | 76.1 |
| 3 | Simong | 26 Feb 2026 | 240 | 199 | 82.9 |
| 4 | Pugging | 15 Mar 2026 | 72 | 68 | 94.4 |
| 5 | Ramsing | 15 Mar 2026 | 83 | 17 | 20.5 |
| 6 | Janbo | 15 Mar 2026 | 59 | 30 | 50.8 |
| 7 | Bomdo | 16 Mar 2026 | 83 | 76 | 91.6 |
| 8 | Likor | 19 Mar 2026 | 134 | 134 | 100.0 |
| 9 | Mosing | 6 May 2026 | 53 | 45 | 84.9 |
| 10 | Miging | 6 May 2026 | 69 | 50 | 72.5 |
| 11 | Ngaming | 6 May 2026 | 74 | 67 | 90.5 |
| 12 | Pango | 6 May 2026 | 56 | 39 | 69.6 |
| 13 | Ninging | 7 May 2026 | 58 | 39 | 67.2 |
| 14 | Angging | 7 May 2026 | 5 | 22 | — |
| 15 | Singging | 7 May 2026 | 21 | 25 | — |
| 16 | Resing | 7 May 2026 | 36 | 45 | — |
| 17 | Palling | 8 May 2026 | 30 | 26 | 86.7 |

*Note rows 14–16 have "agreed > households" in the source docx — flag for client confirmation; treat percent as "—" until clarified.*

**Siang District (8 villages)**

| # | Village | MoU date | Households | Agreed | % |
|---|---|---|---|---|---|
| 1 | Pangkang Kumku | 23 May 2025 | 80 | 46 | 57.5 |
| 2 | Riga | 11 Jul 2025 | 422 | 306 | 72.5 |
| 3 | Riew | 25 Jul 2025 | 157 | 114 | 72.6 |
| 4 | Begging | 19 Aug 2025 | 42 | 36 | 85.7 |
| 5 | Parong Rongku | 20 Sep 2025 | 108 | 74 | 68.5 |
| 6 | Sitang & Dite Dime | 21 Feb 2026 | 84 | 59 | 70.2 |
| 7 | Haleng | 26 Feb 2026 | 8 | 8 | 100.0 |
| 8 | Pangkang Jorkong | 3 Mar 2026 | 86 | 74 | 86.0 |

### 5.4 Coordinate sourcing strategy

| Source | Count | Approach |
|---|---|---|
| Exact match in `SETTLEMENT.shp` | ~17 | Read centroid lat/lng directly |
| Variant-spelling match in `SETTLEMENT` or `IMPORTANT_LOCATION` | ~2 | Manual mapping (e.g., Miging = "Migging") |
| Approximate from `SIANG PINNED MAPS.pdf` | ~6 | Eyeball relative to rivers/known villages; mark `isApproximate: true` |

**Special cases**
- **Sitang & Dite Dime** → single merged pin labeled "Sitang & Dite Dime", placed midway between the two settlements
- **Pangkang Kumku & Pangkang Jorkong** → two separate pins (~0.3 km apart) since they're distinct MoU entries

## 6. UI / Visual design

### 6.1 Page layout

```
┌──────────────────────────────────────────────┐
│ HEADER (title + subtitle)                    │
├──────────────────────────────────────────────┤
│ TOPNAV   [Siang]  [Upper Siang]              │
├──────────────────────────────────────────────┤
│                                              │
│              📌 Riga                         │
│                                              │
│                    📌 Haleng (100%)          │
│                                              │
│         (Leaflet map fills remaining height) │
│                                              │
└──────────────────────────────────────────────┘
```

### 6.2 Color palette (light mode, high-contrast)

| Element | Color |
|---|---|
| Page background | `#FAFAFA` |
| Map canvas | `#FFFFFF` |
| District boundary | `#111827` (2 px solid) |
| Drainage | `#BFDBFE` (1 px) |
| Rivers | `#2563EB` (2 px) |
| Verified pin | `#DC2626` filled |
| Approximate pin | `#DC2626` outline, dashed |
| 100% agreement badge | `#F59E0B` star |
| Pin label chip | white bg, black text, soft shadow |
| Tooltip border | `#000000` 1.5 px |
| Active nav tab underline | `#000000` 2 px |
| Inactive nav tab text | `#6B7280` |

### 6.3 Pin design

- Verified pin: 16 px red circle, white inner dot
- Approximate pin: 16 px red dashed ring, no fill
- 100% pin: tiny amber star ⭐ overlaid on corner (Haleng + Likor)
- Hover: marker scales `1.15×`, 150 ms transition
- Label chip: white pill below pin, 11 px Inter Medium, soft shadow, always visible

### 6.4 Tooltip card (matches client's screenshot)

- Width 300 px
- White card, padding 16 px
- Bordered upper block: `1.5px solid #000`
  - Village name (16 px Inter Bold, centered)
  - `MoU signed on` → date
  - `No. of Households` → number
  - `No. of Households agreed for PFR` → number
- Bold row outside the border:
  - `% of Households Agreed for PFR` → percent (14 px Inter Bold)
- Appears on hover with 80 ms enter delay (debounce flicker), 150 ms fade
- Auto-flips position near map edge to avoid clipping

### 6.5 Typography

- **Inter** (Google Fonts) with system sans fallback
- Header title: 22 px SemiBold
- Header subtitle: 14 px Regular, gray
- Nav tab: 14 px Medium (Bold when active)
- Tooltip title: 16 px Bold
- Tooltip body: 13 px Regular, 8 px row gap

### 6.6 Motion

- Tab switch → Leaflet `flyToBounds` (0.8 s, ease)
- Pin hover → scale 1.15
- Tooltip → fade only (no slide)

## 7. Verification plan

Manual checks performed before declaring done:

1. **Data integrity script** — asserts 25 entries, valid lat/lng inside correct district bbox, percent matches `agreed / households × 100`
2. **Visual map checks** — district outline renders cleanly; rivers in correct blue; all 25 pins visible; labels don't overlap markers
3. **Tooltip content spot-check** — verify Komkar (98.1%), Haleng (100%), Ramsing (20.5%), one approximate pin show correct data
4. **Tab switching** — smooth fly-to, no empty flash
5. **Edge handling** — tooltips near map edge auto-flip; rapid hover doesn't cause flicker
6. **Build** — `npm run build` succeeds, output < 1 MB, `npm run preview` serves correctly
7. **Cross-browser** — Chrome + Safari on macOS

## 8. Open questions / risks

| Item | Note |
|---|---|
| Upper Siang rows 14–16 (Angging, Singging, Resing) | Source docx shows agreed > households — display "—" for %, flag to client |
| Approximate pin precision | ~6 villages eyeballed from PDF; place at centroid of named neighbors if PDF reference is unclear; client should sign off on placement before launch |
| Future data updates | No CMS; updating a village means editing `villages.ts` and rebuilding |

## 9. Next step

Invoke the `writing-plans` skill to produce a step-by-step implementation plan covering: project scaffold → data prep → component build → polish → verification.
