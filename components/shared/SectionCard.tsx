'use client';

export default function SectionCard({
  number, title, description, children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#e5eae1] bg-white p-5 shadow-[0_8px_30px_rgba(65,82,55,0.04)] sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf2e5] text-[11px] font-bold text-[#5c805b]">
          {number}
        </span>
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-1 text-xs text-[#99a398]">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}