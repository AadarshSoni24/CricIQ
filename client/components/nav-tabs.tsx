"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import { Trophy, UserSearch, Gavel, Swords, MapPin } from "lucide-react"

export type TabKey =
  | "predictor"
  | "scout"
  | "auction"
  | "matchup"
  | "venue"

export const TABS: { key: TabKey; label: string; icon: LucideIcon; hint: string; badge?: string }[] = [
  { key: "predictor", label: "Match Predictor", icon: Trophy, hint: "Win probability & SHAP factors" },
  { key: "scout", label: "Player Scout", icon: UserSearch, hint: "Scouting IQ & archetype splits" },
  { key: "auction", label: "Auction Intel", icon: Gavel, hint: "Purse tracker & squad planner", badge: "₹100 Cr" },
  { key: "matchup", label: "Matchup Explorer", icon: Swords, hint: "Batter vs Bowler head-to-head" },
  { key: "venue", label: "Venue Intel", icon: MapPin, hint: "Pitch DNA & ground telemetry" },
]

type Props = {
  active: TabKey
  onChange: (k: TabKey) => void
}

export function NavTabs({ active, onChange }: Props) {
  return (
    <nav className="sticky top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-xl transition-all">
      <div className="mx-auto w-full max-w-[1440px] px-2 sm:px-4 lg:px-6">
        <div
          role="tablist"
          aria-label="CricIQ Navigation Sections"
          className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar"
        >
          {TABS.map((t) => {
            const Icon = t.icon
            const isActive = active === t.key
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(t.key)}
                className={cn(
                  "group relative flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-card text-foreground ring-1 ring-primary/40 shadow-[0_4px_20px_-4px_rgba(0,229,153,0.25)]"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground hover:border-border",
                )}
              >
                <div
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "text-muted-foreground group-hover:text-foreground group-hover:bg-background/40",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-display font-semibold tracking-wide text-xs sm:text-sm">
                    {t.label}
                  </span>
                </div>
                {t.badge && (
                  <span
                    className={cn(
                      "hidden sm:inline-block rounded-md px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase",
                      isActive
                        ? "bg-secondary/20 text-secondary border border-secondary/30"
                        : "bg-background/50 text-muted-foreground",
                    )}
                  >
                    {t.badge}
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute -bottom-2.5 left-4 right-4 h-0.5 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--primary), var(--secondary), #38bdf8)",
                      boxShadow: "0 0 10px rgba(0, 229, 153, 0.8)",
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
