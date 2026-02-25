"use client";

interface ReadingProgressProps {
  current: number;
  total: number;
}

export function ReadingProgress({ current, total }: ReadingProgressProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="sticky top-[57px] z-30">
      <div className="h-0.5 w-full bg-ink/[0.04]">
        <div
          className="h-full bg-ink transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mx-auto max-w-[680px] px-6">
        <p className="py-1 text-right text-[10px] text-ink-muted">
          {current} of {total}
        </p>
      </div>
    </div>
  );
}
