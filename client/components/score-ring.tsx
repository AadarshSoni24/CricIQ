"use client"

import { CountUp } from "./count-up"

export function ScoreRing({ value }: { value: number }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  const tone = value >= 85 ? "#00d4aa" : value >= 70 ? "#f59e0b" : "#9ca3af"

  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle cx="40" cy="40" r={r} stroke="#1f2937" strokeWidth="6" fill="none" />
        <circle
          cx="40"
          cy="40"
          r={r}
          stroke={tone}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={String(offset)}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold leading-none" style={{ color: tone }}>
          <CountUp value={value} />
        </span>
        <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground">
          Score
        </span>
      </div>
    </div>
  )
}
