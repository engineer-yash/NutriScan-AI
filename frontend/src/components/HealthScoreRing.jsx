import { useMemo } from 'react';

/**
 * Animated circular health-score ring.
 * Color shifts from red → amber → leaf as score improves.
 */
export default function HealthScoreRing({ score = 0, size = 140, stroke = 12, label = 'Health Score' }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color = useMemo(() => {
    if (clamped >= 70) return '#1f9247';  // leaf-600
    if (clamped >= 40) return '#f5b301';  // sun
    return '#d93025';                      // red
  }, [clamped]);

  return (
    <div className="flex flex-col items-center gap-2" data-testid="health-score-ring">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" strokeWidth={stroke} className="ring-track" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" strokeWidth={stroke}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-value"
        />
      </svg>
      <div className="-mt-[88px] text-center pointer-events-none" style={{ width: size }}>
        <div className="font-display text-4xl font-bold" style={{ color }}>{clamped}</div>
        <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">{label}</div>
      </div>
      <div className="h-[70px]" />
    </div>
  );
}