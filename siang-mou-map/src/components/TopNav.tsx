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
    <nav
      aria-label="District selector"
      className="flex items-center gap-8 border-b border-gray-200 bg-white px-8"
    >
      {TABS.map(tab => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            // Treat the tab change as a soft page change for assistive tech.
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
            className={`relative py-3 text-sm transition-colors
                       focus-visible:outline focus-visible:outline-2
                       focus-visible:outline-offset-2 focus-visible:outline-blue-600
                       focus-visible:rounded-sm ${
              active
                ? 'font-bold text-gray-900'
                : 'font-medium text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {active && (
              <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] bg-black" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
