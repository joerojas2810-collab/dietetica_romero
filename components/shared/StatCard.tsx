'use client';

export default function StatCard({
  label, value, icon, accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="group rounded-2xl border border-[#e5eae1] bg-white p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          accent === 'green'
            ? 'bg-[#e8edda] text-[#60763a]'
            : accent === 'sand'
              ? 'bg-[#f5ecdb] text-[#a98548]'
              : accent === 'blue'
                ? 'bg-[#e3edf0] text-[#597d85]'
                : 'bg-[#edeae3] text-[#7a806b]'
        }`}
      >
        {icon}
      </span>
      <p className="mt-4 text-xs text-[#8b988b]">{label}</p>
      <p className="mt-1 text-[22px] font-bold tracking-[-0.05em]">{value}</p>
    </div>
  );
}