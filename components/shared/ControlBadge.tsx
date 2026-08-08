'use client';

import { money } from '@/lib/helpers';

export default function ControlBadge({
  label, dif, status,
}: {
  label: string;
  dif: number | null;
  status: string;
}) {
  const colors = {
    ok: 'bg-[#e5f1e2] text-[#3d6942] border-[#c9ddc5]',
    warn: 'bg-[#fef9e7] text-[#926c00] border-[#f0d296]',
    error: 'bg-[#fdf0ee] text-[#ba4a3a] border-[#f0b9b3]',
    'sin-dato': 'bg-[#f5f5f5] text-[#888] border-[#ddd]',
  };
  const dot = {
    ok: 'bg-[#76ad6d]',
    warn: 'bg-[#e1bb70]',
    error: 'bg-[#d9534f]',
    'sin-dato': 'bg-[#aaa]',
  };

  return (
    <div className={`flex items-center justify-between rounded-2xl border p-4 ${colors[status as keyof typeof colors]}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot[status as keyof typeof dot]}`} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold">{dif !== null ? money(dif) : '—'}</span>
    </div>
  );
}