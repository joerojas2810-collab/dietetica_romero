'use client';

export default function AmountField({
  label, value, setValue, icon,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#788778]">
          {icon && <span className="text-[#789473]">{icon}</span>}
          {label}
        </span>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#a7b0a5]">$</span>
        <input
          value={value}
          onChange={e => setValue(e.target.value.replace(/[^0-9]/g, ''))}
          inputMode="numeric"
          placeholder="0"
          className="h-12 w-full rounded-xl border border-[#e2e8df] bg-[#fbfcfa] pl-7 pr-3 text-sm font-semibold outline-none transition focus:border-[#9ab498] focus:bg-white focus:ring-2 focus:ring-[#dcebd8]"
        />
      </div>
    </label>
  );
}