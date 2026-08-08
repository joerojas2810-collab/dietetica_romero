'use client';

export default function NavItem({
  icon, label, badge, active, onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
        active
          ? 'bg-[#edf0e2] text-[#4d612e] shadow-sm'
          : 'text-[#788578] hover:bg-[#f0f4ec] hover:text-[#3c5d41]'
      }`}
    >
      <span className={active ? 'text-[#6f8441]' : 'text-[#96a396] group-hover:text-[#5a7a5d]'}>
        {icon}
      </span>
      <span>{label}</span>
      {badge && (
        <span className="ml-auto rounded-full bg-[#e4ead4] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#566735]">
          {badge}
        </span>
      )}
    </button>
  );
}