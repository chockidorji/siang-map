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
