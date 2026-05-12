import type { Village } from '../data/villages';

interface Props {
  village: Village;
  /** Pixel position of the pin, relative to the map container */
  x: number;
  y: number;
}

function formatDate(raw: string): string {
  // Source already pretty: "30th December 2025" — pass through
  return raw;
}

export default function VillageTooltip({ village, x, y }: Props) {
  const { mou } = village;
  // Position card top-right of pin (with offset). Right-edge flip handled by parent if needed.
  const style: React.CSSProperties = {
    transform: `translate(${x + 14}px, ${y - 90}px)`,
  };

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-[1000] w-[300px]
                 animate-[fadeIn_150ms_ease-out]"
      style={style}
    >
      <div className="rounded-sm border-[1.5px] border-black bg-white p-4 shadow-md">
        <h3 className="mb-3 text-center text-[16px] font-bold text-gray-900">
          {village.name}
        </h3>
        <dl className="space-y-2 text-[13px] text-gray-900">
          <div className="flex items-baseline justify-between gap-4">
            <dt>MoU signed on</dt>
            <dd className="text-right">{formatDate(mou.signedOn)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt>No. of Households</dt>
            <dd>{mou.households}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt>No. of Households agreed for PFR</dt>
            <dd>{mou.agreedForPFR}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4 px-4 text-[14px] font-bold text-gray-900">
        <span>% of Households Agreed for PFR</span>
        <span>{mou.percentAgreed === null ? '—' : `${mou.percentAgreed.toFixed(1)}%`}</span>
      </div>
      {village.isApproximate && (
        <p className="mt-1 px-4 text-[10px] italic text-gray-500">Location approximated</p>
      )}
    </div>
  );
}
