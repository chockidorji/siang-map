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
