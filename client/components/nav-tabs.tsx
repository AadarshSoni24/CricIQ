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

export const TABS: { key: TabKey; label: string; icon: LucideIcon; hint: string }[] = [
  { key: "predictor", label: "Match Predictor", icon: Trophy, hint: "Win probability" },
  { key: "scout", label: "Player Scout", icon: UserSearch, hint: "Form & archetype" },
  { key: "auction", label: "Auction Intel", icon: Gavel, hint: "Squad builder" },
  { key: "matchup", label: "Matchup Explorer", icon: Swords, hint: "Bowler vs Batter" },
  { key: "venue", label: "Venue Intel", icon: MapPin, hint: "Pitch & conditions" },
]

type Props = {
  active: TabKey
  onChange: (k: TabKey) => void
}

export function NavTabs({ active, onChange }: Props) {
  return (
    <nav className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[1400px] px-2 sm:px-4 lg:px-6">
        <div
          role="tablist"
          aria-label="CricIQ sections"
          className="flex items-center gap-1 overflow-x-auto py-2"
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
                  "group relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-card text-foreground ring-1 ring-primary/30"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="font-display tracking-wide">{t.label}</span>
                {isActive && (
                  <span
                    className="absolute -bottom-2 left-3 right-3 h-0.5 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--primary), var(--secondary))",
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
