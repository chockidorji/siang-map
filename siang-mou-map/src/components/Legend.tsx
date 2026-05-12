// Floating map key — explains the two visual languages used on the map.
//
//   1. PFR pin colour ↔ MoU agreement rate threshold (≥80 / ≥40 / <40)
//   2. Non-PFR location label tier (district HQ / ADC / Circle-EAC / settlement)
//
// The legend is purely informative — it pairs each visual cue with a sample
// so a presenter walking through the map for the first time has a quick
// translation key in the corner. Positioned bottom-right (Leaflet's scale
// bar sits bottom-left), with a soft white surface that matches the rest
// of the UI.
//
// Kept compact so it doesn't eat into the polygon footprint on smaller
// screens. The fixed width and small leading mean it reads at one glance.

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const PIN_COLOURS = [
  { c: '#059669', label: '≥ 80% agreed' },
  { c: '#F97316', label: '40 – 80%' },
  { c: '#DC2626', label: '< 40%' },
] as const;

export default function Legend({ collapsed, onToggle }: Props) {
  return (
    <aside
      aria-label="Map key"
      className="pointer-events-auto absolute bottom-3 right-3 z-[600] w-[170px]
                 select-none rounded-md border border-gray-200 bg-white/85 px-2.5 py-2
                 text-[10.5px] text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_10px_rgba(0,0,0,0.06)]
                 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="flex w-full items-center justify-between text-[10px]
                   font-semibold uppercase tracking-[0.08em] text-gray-500
                   hover:text-gray-900 focus-visible:outline focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Key
        <span aria-hidden="true" className="text-[10px] leading-none text-gray-400">
          {collapsed ? '+' : '−'}
        </span>
      </button>

      {!collapsed && (
        <>
          {/* PFR pin colour key */}
          <div className="mt-1.5 space-y-[3px]">
            <div className="text-[8.5px] font-semibold uppercase tracking-wider text-gray-400">
              PFR agreement
            </div>
            {PIN_COLOURS.map(({ c, label }) => (
              <div key={c} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: c }}
                />
                <span className="tabular-nums">{label}</span>
              </div>
            ))}
          </div>

          {/* Location-tier typography key */}
          <div className="mt-2 border-t border-gray-100 pt-1.5 space-y-[2px]">
            <div className="text-[8.5px] font-semibold uppercase tracking-wider text-gray-400">
              Labels (no pin)
            </div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-slate-900">
              District HQ
            </div>
            <div className="text-[10px] font-semibold text-slate-800">
              ADC HQ
            </div>
            <div className="text-[9.5px] font-semibold text-slate-700">
              Circle / EAC HQ
            </div>
            <div className="text-[8.5px] text-slate-400">
              Settlement
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
