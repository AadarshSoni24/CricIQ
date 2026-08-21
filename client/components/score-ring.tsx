"use client"

import { CountUp } from "./count-up"
import { cn } from "@/lib/utils"

export function ScoreRing({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: { box: 64, r: 26, stroke: 4.5, text: "text-lg", sub: "text-[7px]" },
    md: { box: 80, r: 33, stroke: 6, text: "text-xl", sub: "text-[8px]" },
    lg: { box: 104, r: 43, stroke: 7.5, text: "text-3xl", sub: "text-[10px]" },
  }
  const cfg = sizeMap[size] || sizeMap.md
  const circ = 2 * Math.PI * cfg.r
  const safeVal = Math.min(100, Math.max(0, value || 0))
  const offset = circ - (safeVal / 100) * circ

  // Professional tiered color scheme from UI-UX Pro Max
  const tone =
    safeVal >= 85
      ? "#00e599" // Elite: Electric Emerald
      : safeVal >= 70
        ? "#38bdf8" // Strong/Pro: Sky Blue
        : safeVal >= 55
          ? "#ffb800" // Solid: Gold/Amber
          : "#94a3b8" // Budget: Slate

  const glowShadow =
    safeVal >= 85
      ? "drop-shadow(0 0 8px rgba(0,229,153,0.5))"
      : safeVal >= 70
        ? "drop-shadow(0 0 8px rgba(56,189,248,0.4))"
        : safeVal >= 55
          ? "drop-shadow(0 0 6px rgba(255,184,0,0.35))"
          : "none"

  return (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: cfg.box, height: cfg.box }}>
      <svg
        viewBox={`0 0 ${cfg.box} ${cfg.box}`}
        className="-rotate-90"
        style={{ width: cfg.box, height: cfg.box, filter: glowShadow }}
      >
        <circle
          cx={cfg.box / 2}
          cy={cfg.box / 2}
          r={cfg.r}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={cfg.stroke}
          fill="none"
        />
        <circle
          cx={cfg.box / 2}
          cy={cfg.box / 2}
          r={cfg.r}
          stroke={tone}
          strokeWidth={cfg.stroke}
          strokeDasharray={circ}
          strokeDashoffset={String(offset)}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className={cn("font-display font-bold leading-none tracking-tight", cfg.text)} style={{ color: tone }}>
          <CountUp value={safeVal} />
        </span>
        <span className={cn("font-bold uppercase tracking-widest text-muted-foreground/90 mt-0.5", cfg.sub)}>
          IQ Score
        </span>
      </div>
    </div>
  )
}
