'use client';

export default function ControlRow({
  label, value, status,
}: {
  label: string;
  value: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className={`h-2 w-2 rounded-full ${
            status === 'ok' ? 'bg-[#a9d89d]' : status === 'warn' ? 'bg-[#e1bb70]' : 'bg-[#d9534f]'
          }`}
        />
        <span className="text-xs text-[#e0eadd]">{label}</span>
      </div>
      <span
        className={`text-xs font-bold ${
          status === 'ok' ? 'text-[#c2e6b9]' : status === 'warn' ? 'text-[#f0d296]' : 'text-[#f0b9b3]'
        }`}
      >
        {value}
      </span>
    </div>
  );
}