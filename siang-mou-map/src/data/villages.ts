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

// Coordinates sourced from `siang-mou-map/scripts/coords-report.txt`
// (SETTLEMENT.shp + IMPORTANT_LOCATION.shp, WGS84) for matched villages.
// Approximate coords (isApproximate: true) eyeballed from SIANG PINNED MAPS.pdf
// for villages absent from the shapefiles.

export const villages: Village[] = [
  // ---------- Upper Siang District (17) ----------
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
    mou: { signedOn: '6th May 2026', households: 53, agreedForPFR: 45, percentAgreed: 84.9 } },
  { id: 'miging',   name: 'Miging',   district: 'upper-siang', lat: 28.852783, lng: 94.772602, isApproximate: false,
    mou: { signedOn: '6th May 2026', households: 69, agreedForPFR: 50, percentAgreed: 72.5 } },
  { id: 'ngaming',  name: 'Ngaming',  district: 'upper-siang', lat: 28.968627, lng: 94.937656, isApproximate: false,
    mou: { signedOn: '6th May 2026', households: 74, agreedForPFR: 67, percentAgreed: 90.5 } },
  { id: 'pango',    name: 'Pango',    district: 'upper-siang', lat: 28.887785, lng: 94.752884, isApproximate: false,
    mou: { signedOn: '6th May 2026', households: 56, agreedForPFR: 39, percentAgreed: 69.6 } },
  { id: 'ninging',  name: 'Ninging',  district: 'upper-siang', lat: 28.900000, lng: 94.980000, isApproximate: true,
    mou: { signedOn: '7th May 2026', households: 58, agreedForPFR: 39, percentAgreed: 67.2 } },
  { id: 'angging',  name: 'Angging',  district: 'upper-siang', lat: 28.933953, lng: 94.826368, isApproximate: false,
    mou: { signedOn: '7th May 2026', households: 5, agreedForPFR: 22, percentAgreed: null } },
  { id: 'singging', name: 'Singging', district: 'upper-siang', lat: 28.940000, lng: 94.850000, isApproximate: true,
    mou: { signedOn: '7th May 2026', households: 21, agreedForPFR: 25, percentAgreed: null } },
  { id: 'resing',   name: 'Resing',   district: 'upper-siang', lat: 28.925000, lng: 94.810000, isApproximate: true,
    mou: { signedOn: '7th May 2026', households: 36, agreedForPFR: 45, percentAgreed: null } },
  { id: 'palling',  name: 'Palling',  district: 'upper-siang', lat: 28.836530, lng: 94.808875, isApproximate: false,
    mou: { signedOn: '8th May 2026', households: 30, agreedForPFR: 26, percentAgreed: 86.7 } },

  // ---------- Siang District (8) ----------
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
  { id: 'haleng',           name: 'Haleng',             district: 'siang', lat: 28.410000, lng: 94.890000, isApproximate: true,
    mou: { signedOn: '26th February 2026', households: 8, agreedForPFR: 8, percentAgreed: 100.0 } },
  { id: 'pangkang-jorkong', name: 'Pangkang Jorkong',   district: 'siang', lat: 28.519470, lng: 95.066185, isApproximate: false,
    mou: { signedOn: '3rd March 2026', households: 86, agreedForPFR: 74, percentAgreed: 86.0 } },
];

// District bounding boxes for Leaflet flyToBounds
// [southWest, northEast] in [lat, lng]
// Computed from min/max of final pin coords, padded out a bit.
export const DISTRICT_BOUNDS: Record<District, [[number, number], [number, number]]> = {
  'siang':       [[28.30, 94.85], [28.55, 95.15]],
  'upper-siang': [[28.45, 94.70], [29.00, 95.15]],
};
