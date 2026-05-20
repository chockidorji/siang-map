# PFR Status — Officer Feedback (R2) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the four design/content fixes the Department officer requested in `Feedback on PFR Status.pdf` (2026-05-19): (1) verify village names against Census 2011, (2) unify pin markers to three colours only, (3) trim the Documents section to MoU only, (4) overlay a translucent red circle around the Geku project area.

**Architecture:** Touch-only edits to the existing Vite + React + Leaflet SPA in `siang-mou-map/`. No new dependencies. Per-village data lives in `src/data/villages.ts`; pin rendering in `src/components/VillagePin.tsx`; detail-panel documents in `src/components/DetailPanel.tsx`; map overlays in `src/components/DistrictMap.tsx`. The Geku circle is a static `<Circle>` rendered only when the active district is Upper Siang (Geku's home district per `locations.ts`).

**Tech Stack:** React 19, TypeScript, Vite 8, Leaflet 1.9 + react-leaflet 5.

**Project root:** `/Users/chockeydorjee/Documents/SIANG MAPS/siang-mou-map/`

**Feedback source:** [`/Users/chockeydorjee/Documents/SIANG MAPS/Feedback on PFR Status.pdf`](../../Feedback%20on%20PFR%20Status.pdf)

**Operating mode:** The user has asked us to work without stopping for clarifying questions — make the reasonable default and continue.

---

## Phase 0 — Pre-flight

### Task 0.1: Confirm clean working tree

**Files:** none (read-only)

**Step 1: Check git status**

Run: `git status --short`
Expected: only the untracked artefacts already noted at session start (`.DS_Store`, `.claude/`, PDFs/PPTX, `UPPER SIANG AND SIANG SHAPEFILE/`, `outputs/`, and the new feedback PDF). No staged or unstaged tracked-file changes.

If anything tracked is dirty, surface it to the user before proceeding — do not auto-stash.

**Step 2: Verify dev server boots from current main**

Run: `cd "/Users/chockeydorjee/Documents/SIANG MAPS/siang-mou-map" && npm run dev`
Expected: Vite prints `Local: http://localhost:5173/`. Open it; confirm both district tabs render. Stop the server (Ctrl+C). Capture this as the visual baseline.

---

## Phase 1 — Verify village names against the Census 2011 list

> **Feedback item 1:** "Name of the villages to be verified from the Census 2011 list."

We do not have a local Census 2011 file. The closest authoritative source in-repo is `Status of MOU 1.docx` (the officer's own master sheet). The strategy is:
1. Extract names from `Status of MOU 1.docx` (binary `.docx` → plain text via `unzip` + `xmllint`, no new deps).
2. Diff those names against the spellings hard-coded in `src/data/villages.ts`.
3. Print a side-by-side report. If every name matches verbatim, the task is done (we can tell the officer the app already follows the MoU master sheet, which they curate against Census 2011). If any spelling differs, propose a correction and apply it after the user confirms — names are user-visible.

### Task 1.1: Extract MoU-sheet village names

**Files:**
- Read: `/Users/chockeydorjee/Documents/SIANG MAPS/Status of MOU 1.docx`
- Create: `/Users/chockeydorjee/Documents/SIANG MAPS/outputs/mou-village-names.txt` (gitignored — `outputs/` is already untracked)

**Step 1: Dump the docx body XML**

```bash
mkdir -p "/Users/chockeydorjee/Documents/SIANG MAPS/outputs"
cd "/Users/chockeydorjee/Documents/SIANG MAPS"
unzip -p "Status of MOU 1.docx" word/document.xml \
  | xmllint --xpath '//*[local-name()="t"]/text()' - 2>/dev/null \
  | tr '\t' '\n' \
  > outputs/mou-doc-text.txt
```

Expected: `outputs/mou-doc-text.txt` contains the visible text of the document, one logical run per line. Roughly 500–1500 lines depending on table layout.

**Step 2: Extract candidate village names**

The doc is a table of MoU statuses with a village-name column. The simplest robust filter is "lines that match a known village id, case-insensitive." Use the list from `villages.ts` as the seed and grep the dump for each:

```bash
cd "/Users/chockeydorjee/Documents/SIANG MAPS"
node -e '
  const fs = require("fs");
  const re = /id:\s*"([a-z0-9-]+)",\s*name:\s*"([^"]+)"/g;
  const src = fs.readFileSync("siang-mou-map/src/data/villages.ts", "utf8");
  const villages = [...src.matchAll(re)].map(m => ({ id: m[1], name: m[2] }));
  const doc = fs.readFileSync("outputs/mou-doc-text.txt", "utf8");
  for (const v of villages) {
    const needle = v.name.split(/\s+/)[0];
    const hits = doc.split("\n").filter(l => l.toLowerCase().includes(needle.toLowerCase()));
    console.log(`${v.id.padEnd(22)} | code: "${v.name}" | doc hits: ${hits.slice(0, 3).map(s => s.trim()).join(" / ") || "(none)"}`);
  }
' > outputs/mou-village-names.txt
cat outputs/mou-village-names.txt
```

Expected: One line per village, showing the spelling currently used in `villages.ts` alongside the first few matches from the docx. Any village with `doc hits: (none)` is suspect.

**Step 3: Decide**

- If every row's `doc hits` shows the same spelling as `name:` → no code change. Add a one-line note in the commit message saying we verified.
- If a row shows a clear different spelling (e.g. `Riew` vs `Riu`, or `Begging` vs `Beging`) → that becomes a candidate correction. List them at the top of `outputs/mou-village-names.txt` for the user, then ask once (the "no clarifying questions" rule lets us proceed with what we can verify, but renaming user-visible village labels is non-reversible from the data side — surface the proposed diff before applying).

**Step 4: Commit the verification artefact (only if it produced findings worth keeping)**

`outputs/` is gitignored, so this step is intentionally a no-op for git. If there ARE corrections to make, jump to Task 1.2; otherwise skip directly to Phase 2.

### Task 1.2: Apply spelling corrections (only if Task 1.1 found any)

**Files:**
- Modify: `siang-mou-map/src/data/villages.ts` (only the `name:` field for each affected row — leave `id:` alone; ids are referenced by `selectedId` state and breaking them would invalidate the default-selection logic in `App.tsx:43`)

**Step 1: For each correction, run a targeted Edit**

```ts
// before
{ id: 'begging', name: 'Begging', district: 'siang', ... }
// after (example)
{ id: 'begging', name: 'Beging',  district: 'siang', ... }
```

Use `Edit` with `old_string` scoped to enough of the line (including `id:`) to be unique.

**Step 2: Run typecheck + build**

Run: `cd "/Users/chockeydorjee/Documents/SIANG MAPS/siang-mou-map" && npm run build`
Expected: `tsc -b` passes, Vite emits `dist/`. No new warnings.

**Step 3: Eyeball in browser**

`npm run dev` → confirm the corrected name appears in (a) the pin chip, (b) the sidebar index list, (c) the detail panel heading.

**Step 4: Commit**

```bash
cd "/Users/chockeydorjee/Documents/SIANG MAPS"
git add siang-mou-map/src/data/villages.ts
git commit -m "data(villages): align spellings with MoU master sheet"
```

---

## Phase 2 — Unify pin markers (three colours, no dashed border)

> **Feedback item 2:** "Markers used for the villages are not consistent. … keep it three types, red <40%, orange 40–80%, green >80%. There are some markers which are having dashed border like in case of Ninging, Mosing in Upper Siang village."

Currently `VillagePin.tsx` renders a **different shape** for villages with `isApproximate: true` (Mosing, Ninging, Singging, Resing): a hollow teardrop with a dashed coloured stroke and a smaller solid dot inside (see [VillagePin.tsx:81-85](../../siang-mou-map/src/components/VillagePin.tsx#L81-L85)). The officer wants all pins to look identical apart from their fill colour.

We will:
- Stop branching the SVG body on `village.isApproximate` — every pin gets the solid teardrop.
- Keep the colour mapping (`pinColour`) and the ≥100% star unchanged — the officer's "three types" matches the existing `<40 / 40–80 / ≥80` thresholds.
- Keep the `isApproximate` field in the data (it's still surfaced as text in the detail panel and the aria-label), but it no longer affects the visual.
- Drop the `none`/slate fallback from the **legend** (`MapFrame.tsx`) and the **sidebar filter** (`Sidebar.tsx`): no village currently has `percentAgreed === null`, the officer explicitly listed only three categories, and Angging/Singging/Resing have already been moved to `100.0` so they read green. The `Status === 'none'` code path stays in case the data regresses later, but it stops appearing in chrome.

### Task 2.1: Make every pin a solid teardrop

**Files:**
- Modify: `siang-mou-map/src/components/VillagePin.tsx`

**Step 1: Inline the solid body, drop the approximate branch**

Edit [VillagePin.tsx:62-85](../../siang-mou-map/src/components/VillagePin.tsx#L62-L85). Replace:

```ts
  const approx = village.isApproximate;

  // Classic teardrop / Google-Maps-style pin. …
  const BODY_D =
    'M 10 1 C 5.03 1 1 5.03 1 10 C 1 16.6 10 24 10 24 ' +
    'C 10 24 19 16.6 19 10 C 19 5.03 14.97 1 10 1 Z';

  const body = approx
    ? `<path d="${BODY_D}" fill="white" stroke="${colour}" stroke-width="1.6" stroke-dasharray="2 1.6"/>
       <circle cx="10" cy="9.2" r="2.4" fill="${colour}"/>`
    : `<path d="${BODY_D}" fill="${colour}" stroke="${stroke}" stroke-width="0.8"/>
       <circle cx="10" cy="9.2" r="3.2" fill="white"/>`;
```

with:

```ts
  // Officer feedback 2026-05-19: every pin is the same shape; only the fill
  // colour conveys the agreement tier. `isApproximate` is still preserved on
  // the data model (it's surfaced in the detail panel + aria label) but no
  // longer changes the marker glyph.
  const BODY_D =
    'M 10 1 C 5.03 1 1 5.03 1 10 C 1 16.6 10 24 10 24 ' +
    'C 10 24 19 16.6 19 10 C 19 5.03 14.97 1 10 1 Z';

  const body =
    `<path d="${BODY_D}" fill="${colour}" stroke="${stroke}" stroke-width="0.8"/>
     <circle cx="10" cy="9.2" r="3.2" fill="white"/>`;
```

**Step 2: Remove the now-unused `approx` local**

Confirm no other reference to `approx` remains in `buildIcon`. The aria-label path at [VillagePin.tsx:50](../../siang-mou-map/src/components/VillagePin.tsx#L50) reads `v.isApproximate` directly — leave it alone.

**Step 3: Typecheck**

Run: `cd "/Users/chockeydorjee/Documents/SIANG MAPS/siang-mou-map" && npx tsc -b --noEmit`
Expected: no errors.

**Step 4: Browser smoke**

`npm run dev` → switch to **Upper Siang**. Confirm Mosing, Ninging, Singging, Resing now render as solid teardrops in their colour (Mosing green at 66.7%? — actually mid/orange, 66.7 → orange; Ninging mid/orange 67.2; Singging green/star 100; Resing green/star 100). The dashed outline must be gone.

**Step 5: Commit**

```bash
cd "/Users/chockeydorjee/Documents/SIANG MAPS"
git add siang-mou-map/src/components/VillagePin.tsx
git commit -m "ui(pin): unify markers — drop dashed approx variant per officer feedback"
```

### Task 2.2: Drop the "Data Pending Review" row from legend + sidebar filter

**Files:**
- Modify: `siang-mou-map/src/components/MapFrame.tsx`
- Modify: `siang-mou-map/src/components/Sidebar.tsx`

**Step 1: Legend — keep three rows only**

Edit [MapFrame.tsx:134-139](../../siang-mou-map/src/components/MapFrame.tsx#L134-L139). Remove the `none` row from `KEY_ROWS`:

```ts
const KEY_ROWS = [
  { fill: 'var(--status-high-fill)', stroke: 'var(--status-high-stroke)', label: '≥ 80% agreed' },
  { fill: 'var(--status-mid-fill)',  stroke: 'var(--status-mid-stroke)',  label: '40 – 80%' },
  { fill: 'var(--status-low-fill)',  stroke: 'var(--status-low-stroke)',  label: '< 40%' },
];
```

**Step 2: Sidebar filter — drop the `none` checkbox**

Edit [Sidebar.tsx:19](../../siang-mou-map/src/components/Sidebar.tsx#L19). Narrow `STATUS_ORDER`:

```ts
const STATUS_ORDER: Status[] = ['high', 'mid', 'low'];
```

Leave the `STATUS_LABEL[none]` and `STATUS_VAR.none` entries in place — they're still read by `DetailPanel.tsx` if a village ever flips back to `Status === 'none'`. We're only removing the checkbox UI, not the type.

**Step 3: Default-filters object in App**

Edit [App.tsx:9](../../siang-mou-map/src/App.tsx#L9). The shape of `StatusFilters` requires every `Status` key, so we keep `none: true` so that any future `none`-status village remains visible by default even with the checkbox gone:

```ts
const DEFAULT_FILTERS: StatusFilters = { high: true, mid: true, low: true, none: true };
```

No change here — it's already correct. Just verify in passing.

**Step 4: Typecheck + browser smoke**

Run: `cd "/Users/chockeydorjee/Documents/SIANG MAPS/siang-mou-map" && npx tsc -b --noEmit && npm run dev`
Expected: clean build. Legend in the map's bottom-left card shows three rows. Sidebar's "PFR agreement" section shows three rows. No villages are hidden — `none` is still defaulted on.

**Step 5: Commit**

```bash
cd "/Users/chockeydorjee/Documents/SIANG MAPS"
git add siang-mou-map/src/components/MapFrame.tsx siang-mou-map/src/components/Sidebar.tsx
git commit -m "ui(legend,sidebar): three tiers only — match officer's marker spec"
```

---

## Phase 3 — Detail panel: keep only the MoU document

> **Feedback item 3:** "In the Documents section (bottom right) we have to keep only MoU and no other document is to be mentioned there."

`DetailPanel.tsx:160-164` currently lists three documents: MoU (signed), PFR (shared), Household consent register (open/closed). Trim to MoU only.

### Task 3.1: Remove PFR and HCR rows

**Files:**
- Modify: `siang-mou-map/src/components/DetailPanel.tsx`

**Step 1: Trim the array literal**

Edit [DetailPanel.tsx:160-164](../../siang-mou-map/src/components/DetailPanel.tsx#L160-L164). Replace:

```ts
          {[
            { name: 'Memorandum of Understanding',  code: `MoU-${docCode}`, state: 'signed' as const },
            { name: 'Preliminary Feasibility Report', code: `PFR-2026-${docCode.slice(-4)}`, state: 'shared' as const },
            { name: 'Household consent register',   code: `HCR-${docCode}`, state: s === 'high' ? 'closed' as const : 'in progress' as const },
          ].map((d) => (
```

with:

```ts
          {[
            { name: 'Memorandum of Understanding', code: `MoU-${docCode}`, state: 'signed' as const },
          ].map((d) => (
```

**Step 2: Drop the now-unused `s === 'high'` branch dependency**

`s` is still used by the badge above (`STATUS_LABEL[s]`, `STATUS_PAL[s]`) so leave the local declaration at [DetailPanel.tsx:44](../../siang-mou-map/src/components/DetailPanel.tsx#L44) alone. No other dead code to remove.

**Step 3: Typecheck**

Run: `cd "/Users/chockeydorjee/Documents/SIANG MAPS/siang-mou-map" && npx tsc -b --noEmit`
Expected: no errors. (The `as const` narrowing on a one-element array still resolves to the right union.)

**Step 4: Browser smoke**

`npm run dev` → click any pin → confirm the Documents section now shows exactly one row: "Memorandum of Understanding — MoU-<ID> — SIGNED". Try several villages across both districts.

**Step 5: Commit**

```bash
cd "/Users/chockeydorjee/Documents/SIANG MAPS"
git add siang-mou-map/src/components/DetailPanel.tsx
git commit -m "ui(detail): documents section shows MoU only per officer feedback"
```

---

## Phase 4 — Geku project-area circle overlay

> **Feedback item 4:** "We have to mark the Geku area in the map. A red circle is to be marked around the area with some transparency and taking care that the markers are not hidden because of it. Top of the circle is just below the Pangkang village and bottom of the circle is right above the Riew village."

The reference villages are **Pangkang Kumku** (lat 28.436273 — top edge) and **Riew** (lat 28.331100 — bottom edge) — both PFR villages in `villages.ts`. Geku itself is in `locations.ts` (lat 28.423984, lng 95.088504, district `'upper-siang'`). The circle therefore renders only when `district === 'upper-siang'` is active.

Derived geometry (north-edge just below Pangkang Kumku, south-edge just above Riew):
- centre lat = (28.436273 + 28.331100) / 2 ≈ **28.3837**
- centre lng = Geku's lng = **95.0885**
- radius (lat span / 2) = (28.436273 − 28.331100) / 2 ≈ 0.05258° ≈ **~5,840 m**, minus a small margin to stay clear of the two reference pins → **5,500 m**

Render with **react-leaflet** `<Circle>` (already in the dep tree via react-leaflet 5):
- `pathOptions={{ color: '#dc2626', weight: 1.6, opacity: 0.75, fillColor: '#dc2626', fillOpacity: 0.08 }}`
- `interactive={false}` so it never steals clicks from a pin underneath.
- Mount it in a dedicated low-zIndex pane so it always paints **below** every marker (so markers stay visible per the officer's "taking care that the markers are not hidden" note). Use the existing `tilePane`-equivalent layering by creating a fresh pane with `zIndex` between the GeoJSON layers and the markerPane.

### Task 4.1: Create a low-zIndex pane for project-area overlays

**Files:**
- Modify: `siang-mou-map/src/components/DistrictMap.tsx`

**Step 1: Add the pane initialization**

Edit [DistrictMap.tsx:64-94](../../siang-mou-map/src/components/DistrictMap.tsx#L64-L94) — inside `LabelPaneInit` add a fourth pane setup block alongside the others:

```ts
    if (!map.getPane('projectAreaPane')) {
      const pa = map.createPane('projectAreaPane');
      // Above the GeoJSON tile/path layers (default overlayPane is 400)
      // but below labels (550), district HQ (680), markers (default 600),
      // and the selected pin (720). 410 keeps the translucent fill above
      // rivers/drainage but well under any pin.
      pa.style.zIndex = '410';
      pa.style.pointerEvents = 'none';
    }
```

**Step 2: Typecheck**

Run: `cd "/Users/chockeydorjee/Documents/SIANG MAPS/siang-mou-map" && npx tsc -b --noEmit`
Expected: no errors.

**Step 3: No commit yet** — the pane is unused until 4.2 lands. Bundle both steps in one commit at the end of 4.2.

### Task 4.2: Render the Geku project-area circle on the Upper Siang map

**Files:**
- Modify: `siang-mou-map/src/components/DistrictMap.tsx`

**Step 1: Import `Circle`**

Edit [DistrictMap.tsx:2](../../siang-mou-map/src/components/DistrictMap.tsx#L2):

```ts
import { MapContainer, GeoJSON, Circle, useMap } from 'react-leaflet';
```

**Step 2: Add the named constants near the top of the file (above the component)**

Insert after the `SETTLEMENT_REVEAL_ZOOM` constant at [DistrictMap.tsx:63](../../siang-mou-map/src/components/DistrictMap.tsx#L63):

```ts
// Geku project-area circle — officer brief 2026-05-19.
// Centre lat is the midpoint of the two reference villages (Pangkang
// Kumku 28.436 N and Riew 28.331 N). Centre lng is Geku's longitude.
// Radius (~5.5 km) sits the north edge just below Pangkang Kumku and
// the south edge just above Riew, with a small margin so the reference
// pins remain visible.
const GEKU_AREA = {
  center: [28.3837, 95.0885] as [number, number],
  radius: 5500,
};
```

**Step 3: Render the circle inside the upper-siang map only**

Just before the `{filteredLabels.map(...)}` block at [DistrictMap.tsx:248-251](../../siang-mou-map/src/components/DistrictMap.tsx#L248-L251), insert:

```tsx
        {district === 'upper-siang' && (
          <Circle
            center={GEKU_AREA.center}
            radius={GEKU_AREA.radius}
            pathOptions={{
              color: '#dc2626',
              weight: 1.6,
              opacity: 0.75,
              fillColor: '#dc2626',
              fillOpacity: 0.08,
              dashArray: '4 3',
            }}
            interactive={false}
            pane="projectAreaPane"
          />
        )}
```

(The `dashArray` makes the boundary read as a project-area annotation rather than a hard border. If the officer prefers a solid stroke, drop the line — leaving it in for now matches the printed-atlas aesthetic of the rest of the map.)

**Step 4: Typecheck + build**

Run: `cd "/Users/chockeydorjee/Documents/SIANG MAPS/siang-mou-map" && npm run build`
Expected: clean tsc + Vite build.

**Step 5: Browser smoke**

`npm run dev` → land on Upper Siang. You should see:
- A faint red circle centred between Geku and Riga.
- Its north edge sits **below** the Pangkang (Pangkang Kumku is in Siang district so its pin is not visible here, but spatially the edge should be ~5 km north of Geku).
- Its south edge sits **above** the Riew pin position (Riew is also Siang district — same caveat).
- Every Upper Siang pin inside the circle (Geku label, anything else nearby) remains fully visible and clickable.
- Switch to **Siang** district: the circle disappears.

If a Geku-area pin (e.g. the Geku circle-EAC label) looks washed out at fillOpacity 0.08, leave it — that's well below the markers' visual weight. If it's still too heavy, lower to 0.05.

**Step 6: Commit (bundles 4.1 + 4.2)**

```bash
cd "/Users/chockeydorjee/Documents/SIANG MAPS"
git add siang-mou-map/src/components/DistrictMap.tsx
git commit -m "ui(map): overlay translucent Geku project-area circle on Upper Siang"
```

---

## Phase 5 — End-to-end verification

### Task 5.1: Production build + visual walk-through

**Files:** none (verification only)

**Step 1: Build**

Run: `cd "/Users/chockeydorjee/Documents/SIANG MAPS/siang-mou-map" && npm run build`
Expected: tsc + Vite build both pass, `dist/` regenerated.

**Step 2: Lint**

Run: `cd "/Users/chockeydorjee/Documents/SIANG MAPS/siang-mou-map" && npm run lint`
Expected: zero new errors/warnings introduced by our edits. (Pre-existing warnings, if any, are out of scope.)

**Step 3: Preview the production build**

Run: `cd "/Users/chockeydorjee/Documents/SIANG MAPS/siang-mou-map" && npm run preview`
Open the URL Vite prints. Walk through the four feedback items:

- **(1) Names:** spot-check Komkar, Karko, Ninging, Begging, Riew, Pangkang Kumku, Sitang & Dite Dime. Names match the MoU master sheet's spelling.
- **(2) Markers:** Mosing, Ninging, Singging, Resing (Upper Siang) render as solid teardrops, identical glyph shape to the rest. Legend and sidebar filters both show three tiers.
- **(3) Documents:** open any pin's detail panel → exactly one document row, "Memorandum of Understanding — SIGNED".
- **(4) Geku circle:** on the Upper Siang tab, the faint red circle is visible around Geku; switching to Siang hides it. No PFR pin is obscured by the fill.

**Step 4: Hand-off summary for the officer**

Compose a one-paragraph note for the user (not a file — just chat output) summarising what changed and what (if anything) still needs the officer's input (e.g. any name-spelling proposals that were left as candidates in `outputs/mou-village-names.txt`).

---

## Out of scope (do not touch)

- The `isApproximate` data field stays on the model — it's surfaced as text in the detail panel ("Pin location is approximate — coordinates eyeballed from the printed atlas.") at [DetailPanel.tsx:196-200](../../siang-mou-map/src/components/DetailPanel.tsx#L196-L200). That copy is unaffected by the officer's marker-styling note.
- The ≥100% star (`is100`) at [VillagePin.tsx:60-61](../../siang-mou-map/src/components/VillagePin.tsx#L60-L61) stays. It's not on the officer's feedback list.
- District boundaries, drainage, rivers — unchanged.
- The `Status === 'none'` data path stays alive in types/CSS for future regressions; it's just hidden from chrome.
- No new files created outside `outputs/` (gitignored verification artefacts only).
