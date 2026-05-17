import { cn } from "@/lib/utils"
import type { Team } from "@/lib/cric-data"

type Props = {
  team: Team
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = {
  sm: "h-9 w-9 text-[10px]",
  md: "h-14 w-14 text-sm",
  lg: "h-20 w-20 text-lg",
}

export function TeamLogo({ team, size = "md", className }: Props) {
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-2xl font-display font-bold tracking-wide shrink-0",
        "ring-1 ring-white/10 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]",
        sizes[size],
        className,
      )}
      style={{
        background: `radial-gradient(120% 120% at 0% 0%, ${team.primary}cc 0%, ${team.secondary}aa 60%, ${team.primary} 100%)`,
        color: "#fff",
      }}
      aria-label={team.name}
    >
      <span className="drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">{team.short}</span>
      <span
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 40%)",
        }}
      />
    </div>
  )
}
