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
