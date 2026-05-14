export type District = 'siang' | 'upper-siang';

export interface MouData {
  signedOn: string;          // e.g., "30th December 2025"
  households: number;
  agreedForPFR: number;
  percentAgreed: number | null;  // null when source data is inconsistent
}

// Status tier — moss/ochre/brick/stone derived from MoU agreement rate. Kept
// as a discriminated union so the palette, filter checkboxes and detail
// panel all read off the same key.
export type Status = 'high' | 'mid' | 'low' | 'none';

export function statusOf(v: Village): Status {
  const p = v.mou.percentAgreed;
  if (p === null) return 'none';
  if (p >= 80) return 'high';
  if (p >= 40) return 'mid';
  return 'low';
}

export interface Village {
  id: string;
  name: string;
  district: District;
  lat: number;
  lng: number;
  isApproximate: boolean;
  mou: MouData;
  /** Admin circle this village belongs to (Boleng, Singa, Riga, …). Optional —
   *  populated where we know it from the SHP, else omitted. */
  circle?: string;
}

// Coordinates sourced from `siang-mou-map/scripts/coords-report.txt`
// (SETTLEMENT.shp + IMPORTANT_LOCATION.shp, WGS84) for matched villages.
// Approximate coords (isApproximate: true) eyeballed from SIANG PINNED MAPS.pdf
// for villages absent from the shapefiles.

export const villages: Village[] = [
  // ---------- Upper Siang District (19) ----------
  { id: 'komkar',   name: 'Komkar',   district: 'upper-siang', lat: 28.483800, lng: 95.111100, isApproximate: false,
    mou: { signedOn: '30th December 2025', households: 262, agreedForPFR: 257, percentAgreed: 98.1 } },
  { id: 'karko',    name: 'Karko',    district: 'upper-siang', lat: 28.568795, lng: 95.056778, isApproximate: false,
    mou: { signedOn: '1st February 2026', households: 138, agreedForPFR: 105, percentAgreed: 76.1 } },
  { id: 'simong',   name: 'Simong',   district: 'upper-siang', lat: 28.602500, lng: 95.069440, isApproximate: false,
    mou: { signedOn: '26th February 2026', households: 240, agreedForPFR: 199, percentAgreed: 82.9 } },
  { id: 'pugging',  name: 'Pugging',  district: 'upper-siang', lat: 28.742530, lng: 94.934200, isApproximate: false,
    mou: { signedOn: '15th March 2026', households: 72, agreedForPFR: 68, percentAgreed: 94.4 } },
  { id: 'ramsing',  name: 'Ramsing',  district: 'upper-siang', lat: 28.662951, lng: 94.990293, isApproximate: false,
    mou: { signedOn: '15th March 2026', households: 83, agreedForPFR: 17, percentAgreed: 20.5 } },
  { id: 'janbo',    name: 'Janbo',    district: 'upper-siang', lat: 28.795784, lng: 94.859209, isApproximate: false,
    mou: { signedOn: '15th March 2026', households: 59, agreedForPFR: 30, percentAgreed: 50.8 } },
  { id: 'bomdo',    name: 'Bomdo',    district: 'upper-siang', lat: 28.753074, lng: 94.897653, isApproximate: false,
    mou: { signedOn: '16th March 2026', households: 83, agreedForPFR: 76, percentAgreed: 91.6 } },
  { id: 'likor',    name: 'Likor',    district: 'upper-siang', lat: 28.826674, lng: 94.895337, isApproximate: false,
    mou: { signedOn: '19th March 2026', households: 134, agreedForPFR: 134, percentAgreed: 100.0 } },
  { id: 'mosing',   name: 'Mosing',   district: 'upper-siang', lat: 28.830000, lng: 94.800000, isApproximate: true,
    mou: { signedOn: '6th May 2026', households: 66, agreedForPFR: 44, percentAgreed: 66.7 } },
  { id: 'miging',   name: 'Miging',   district: 'upper-siang', lat: 28.852783, lng: 94.772602, isApproximate: false,
    mou: { signedOn: '6th May 2026', households: 96, agreedForPFR: 50, percentAgreed: 52.1 } },
  { id: 'ngaming',  name: 'Ngaming',  district: 'upper-siang', lat: 28.968627, lng: 94.937656, isApproximate: false,
    mou: { signedOn: '6th May 2026', households: 83, agreedForPFR: 67, percentAgreed: 80.7 } },
  { id: 'pango',    name: 'Pango',    district: 'upper-siang', lat: 28.887785, lng: 94.752884, isApproximate: false,
    mou: { signedOn: '6th May 2026', households: 56, agreedForPFR: 54, percentAgreed: 96.4 } },
  { id: 'ninging',  name: 'Ninging',  district: 'upper-siang', lat: 28.900000, lng: 94.980000, isApproximate: true,
    mou: { signedOn: '7th May 2026', households: 58, agreedForPFR: 39, percentAgreed: 67.2 } },
  // Angging / Singging / Resing: agreed count exceeds household count in
  // the source figures. Per the Department officer (13 May 2026): the
  // villages are green (have signed and are at or above full agreement)
  // but the displayed rate is capped at 100%. Household and agreed
  // numbers preserved as recorded.
  { id: 'angging',  name: 'Angging',  district: 'upper-siang', lat: 28.933953, lng: 94.826368, isApproximate: false,
    mou: { signedOn: '7th May 2026', households: 12, agreedForPFR: 18, percentAgreed: 100.0 } },
  { id: 'singging', name: 'Singging', district: 'upper-siang', lat: 28.940000, lng: 94.850000, isApproximate: true,
    mou: { signedOn: '7th May 2026', households: 21, agreedForPFR: 25, percentAgreed: 100.0 } },
  { id: 'resing',   name: 'Resing',   district: 'upper-siang', lat: 28.925000, lng: 94.810000, isApproximate: true,
    mou: { signedOn: '7th May 2026', households: 36, agreedForPFR: 45, percentAgreed: 100.0 } },
  { id: 'palling',  name: 'Palling',  district: 'upper-siang', lat: 28.836530, lng: 94.808875, isApproximate: false,
    mou: { signedOn: '8th May 2026', households: 30, agreedForPFR: 26, percentAgreed: 86.7 } },
  // Zido — added per the 8 May 2026 MoU sheet (Status of MOU 1.docx).
  // Coordinates from the SHP entry 'Jido' (variant transcription of the
  // same village; the PDF atlas and SHP both use 'Jido').
  { id: 'zido',     name: 'Zido',     district: 'upper-siang', lat: 28.982156, lng: 94.905050, isApproximate: false,
    mou: { signedOn: '8th May 2026', households: 55, agreedForPFR: 36, percentAgreed: 65.5 } },
  // Haleng — reclassified from Siang to Upper Siang per the Department
  // officer's correction (13 May 2026), and re-pinned to the SHP-exact
  // coordinates (SHP feature 'Halleng', OBJECTID 1585) near Yingkiong H.Q.
  // — the previous eyeballed coords had it ~25 km too far west.
  { id: 'haleng',   name: 'Haleng',   district: 'upper-siang', lat: 28.606510, lng: 95.038960, isApproximate: false,
    mou: { signedOn: '26th February 2026', households: 8, agreedForPFR: 8, percentAgreed: 100.0 } },

  // ---------- Siang District (7) ----------
  { id: 'pangkang-kumku',   name: 'Pangkang Kumku',     district: 'siang', lat: 28.436273, lng: 95.107728, isApproximate: false,
    mou: { signedOn: '23rd May 2025', households: 80, agreedForPFR: 46, percentAgreed: 57.5 } },
  { id: 'riga',             name: 'Riga',               district: 'siang', lat: 28.434147, lng: 95.043929, isApproximate: false,
    mou: { signedOn: '11th July 2025', households: 422, agreedForPFR: 306, percentAgreed: 72.5 } },
  { id: 'riew',             name: 'Riew',               district: 'siang', lat: 28.331100, lng: 95.055957, isApproximate: false,
    mou: { signedOn: '25th July 2025', households: 157, agreedForPFR: 114, percentAgreed: 72.6 } },
  { id: 'begging',          name: 'Begging',            district: 'siang', lat: 28.325827, lng: 95.006730, isApproximate: false,
    mou: { signedOn: '19th August 2025', households: 42, agreedForPFR: 36, percentAgreed: 85.7 } },
  { id: 'parong-rongku',    name: 'Parong Rongku',      district: 'siang', lat: 28.350995, lng: 95.021651, isApproximate: false,
    mou: { signedOn: '20th September 2025', households: 108, agreedForPFR: 74, percentAgreed: 68.5 } },
  { id: 'sitang-dite-dime', name: 'Sitang & Dite Dime', district: 'siang', lat: 28.371267, lng: 95.059300, isApproximate: false,
    mou: { signedOn: '21st February 2026', households: 84, agreedForPFR: 59, percentAgreed: 70.2 } },
  { id: 'pangkang-jorkong', name: 'Pangkang Jorkong',   district: 'siang', lat: 28.519470, lng: 95.066185, isApproximate: false,
    mou: { signedOn: '3rd March 2026', households: 86, agreedForPFR: 74, percentAgreed: 86.0 } },
];

// District bounding boxes for Leaflet flyToBounds — [southWest, northEast] in [lat, lng].
// Tight to the polygon extent (no extra margin) so the polygon fills the
// frame; fitBounds adds a small pixel padding for breathing room.
//
// Polygon extents (from public/geo/district-*.geojson):
//   Siang:       lat 28.028 → 28.980, lng 94.368 → 95.224
//   Upper Siang: lat 28.161 → 29.348, lng 94.225 → 95.411
export const DISTRICT_BOUNDS: Record<District, [[number, number], [number, number]]> = {
  'siang':       [[28.025, 94.365], [28.985, 95.230]],
  'upper-siang': [[28.155, 94.220], [29.355, 95.420]],
};
