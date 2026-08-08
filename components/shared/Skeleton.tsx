'use client';

import type { CSSProperties } from 'react';

export function SkeletonPulse({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#e8ece4] ${className ?? ''}`}
      style={style}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#e5eae1] bg-white p-4 ${className ?? ''}`}>
      <SkeletonPulse className="h-9 w-9 rounded-xl" />
      <SkeletonPulse className="mt-4 h-3 w-16" />
      <SkeletonPulse className="mt-2 h-7 w-28" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#edf0eb] p-3">
      <div className="flex items-center gap-3">
        <SkeletonPulse className="h-7 w-7 rounded-lg" />
        <div>
          <SkeletonPulse className="h-3 w-32" />
          <SkeletonPulse className="mt-1.5 h-2 w-20" />
        </div>
      </div>
      <SkeletonPulse className="h-4 w-20" />
    </div>
  );
}

export function SkeletonChart({ height = 'h-[260px]' }: { height?: string }) {
  return (
    <div className={`rounded-3xl border border-[#e5eae1] bg-white p-6 ${height}`}>
      <SkeletonPulse className="h-4 w-32" />
      <SkeletonPulse className="mt-2 h-3 w-48" />
      <div className="mt-6 flex items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonPulse
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${40 + Math.random() * 80}px` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonSection() {
  return (
    <div className="rounded-3xl border border-[#e5eae1] bg-white p-6">
      <SkeletonPulse className="h-4 w-40" />
      <SkeletonPulse className="mt-2 h-3 w-64" />
      <div className="mt-5 space-y-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}