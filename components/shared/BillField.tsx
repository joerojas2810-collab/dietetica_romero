'use client';

import { money } from '@/lib/helpers';

export default function BillField({
  label, qty, setQty, denom,
}: {
  label: string;
  qty: string;
  setQty: (v: string) => void;
  denom: number;
}) {
  const total = (parseInt(qty) || 0) * denom;

  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-[11px] font-semibold text-[#788778]">
        <span>Billetes {label}</span>
        <span className="text-[#40562a]">{total > 0 ? money(total) : ''}</span>
      </span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#a7b0a5]">×</span>
        <input
          value={qty}
          onChange={e => setQty(e.target.value.replace(/[^0-9]/g, ''))}
          inputMode="numeric"
          placeholder="0"
          className="h-12 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] pl-7 pr-3 text-sm font-semibold outline-none transition focus:border-[#9ab498] focus:bg-white focus:ring-2 focus:ring-[#dcebd8]"
        />
      </div>
    </label>
  );
}   