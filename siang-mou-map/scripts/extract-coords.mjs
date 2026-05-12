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
