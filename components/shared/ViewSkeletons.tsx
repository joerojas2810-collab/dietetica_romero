'use client';

import {
  SkeletonPulse, SkeletonCard, SkeletonRow,
  SkeletonChart, SkeletonSection,
} from './Skeleton';

// ── Dashboard ─────────────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <SkeletonPulse className="h-3 w-32" />
        <SkeletonPulse className="mt-3 h-9 w-64" />
        <SkeletonPulse className="mt-2 h-3 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  );
}

// ── DayForm ───────────────────────────────────────────────────────────
export function DayFormSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <SkeletonPulse className="h-3 w-24" />
        <SkeletonPulse className="mt-3 h-9 w-48" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-[#e5eae1] bg-white p-6">
            <SkeletonPulse className="h-4 w-36" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonPulse key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-[#e5eae1] bg-white p-6">
            <SkeletonPulse className="h-4 w-36" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonPulse key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
        </div>
        <div>
          <SkeletonPulse className="h-[360px] w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

// ── Movements ─────────────────────────────────────────────────────────
export function MovementsSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <SkeletonPulse className="h-3 w-20" />
        <SkeletonPulse className="mt-3 h-9 w-48" />
      </div>
      <div className="rounded-3xl border border-[#e5eae1] bg-white">
        <div className="border-b border-[#edf0eb] p-5">
          <SkeletonPulse className="h-10 w-full max-w-xs" />
        </div>
        <div className="p-5 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <SkeletonPulse className="h-4 w-20" />
              <SkeletonPulse className="h-4 w-40 flex-1" />
              <SkeletonPulse className="h-5 w-16 rounded-full" />
              <SkeletonPulse className="h-4 w-20" />
              <SkeletonPulse className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Control (Banco / MP) ──────────────────────────────────────────────
export function ControlSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <SkeletonPulse className="h-3 w-28" />
        <SkeletonPulse className="mt-3 h-9 w-40" />
        <SkeletonPulse className="mt-2 h-3 w-56" />
      </div>
      <div className="max-w-xl space-y-5">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6">
          <SkeletonPulse className="h-4 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonPulse key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
        <SkeletonSection />
      </div>
    </div>
  );
}

// ── Cartuchera ────────────────────────────────────────────────────────
export function CartucheraSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <SkeletonPulse className="h-3 w-24" />
        <SkeletonPulse className="mt-3 h-9 w-40" />
      </div>
      <div className="max-w-xl space-y-5">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6">
          <SkeletonPulse className="h-3 w-48" />
          <SkeletonPulse className="mt-3 h-10 w-40" />
        </div>
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6">
          <SkeletonPulse className="h-4 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <SkeletonPulse className="h-14" />
            <SkeletonPulse className="h-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pagos ─────────────────────────────────────────────────────────────
export function PagosSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <SkeletonPulse className="h-3 w-28" />
        <SkeletonPulse className="mt-3 h-9 w-52" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6">
          <SkeletonPulse className="h-4 w-36 mb-5" />
          <SkeletonPulse className="h-12 w-full mb-3" />
          <SkeletonPulse className="h-12 w-full mb-3" />
          <div className="grid grid-cols-4 gap-2 mb-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonPulse key={i} className="h-10" />
            ))}
          </div>
          <SkeletonPulse className="h-12 w-full" />
        </div>
        <div className="rounded-3xl border border-[#e5eae1] bg-white p-6">
          <SkeletonPulse className="h-4 w-48 mb-5" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Genérico (Config, CierreMes, Reportes) ───────────────────────────
export function GenericSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-8">
        <SkeletonPulse className="h-3 w-28" />
        <SkeletonPulse className="mt-3 h-9 w-48" />
        <SkeletonPulse className="mt-2 h-3 w-64" />
      </div>
      <div className="max-w-xl space-y-5">
        <SkeletonSection />
        <SkeletonSection />
      </div>
    </div>
  );
}