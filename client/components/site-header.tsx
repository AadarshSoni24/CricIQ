"use client"

import { CricketBat, CricketBall } from "./cricket-icons"
import { Activity, Bell, Cpu, Sparkles } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="relative z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3.5">
          <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary/25 via-primary/10 to-secondary/20 ring-1 ring-primary/40 shadow-[0_0_24px_-4px_rgba(0,229,153,0.3)]">
            <CricketBat className="h-6 w-6 text-primary drop-shadow-[0_0_8px_rgba(0,229,153,0.4)]" />
            <CricketBall
              className="absolute -bottom-1 -right-1 h-4 w-4 text-secondary drop-shadow-[0_0_8px_rgba(255,184,0,0.6)]"
              aria-hidden
            />
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl font-bold tracking-tight">
              <span className="text-foreground">Cric</span>
              <span className="text-gradient-primary font-extrabold">IQ</span>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1.5">
              <span>IPL Intelligence Platform</span>
            </div>
          </div>

          {/* Live Status Badge */}
          <div className="ml-3 hidden items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 sm:flex shadow-[0_0_12px_rgba(239,68,68,0.15)]">
            <span className="relative grid place-items-center">
              <span className="relative h-2 w-2 rounded-full bg-destructive">
                <span className="live-dot" aria-hidden />
              </span>
            </span>
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-destructive">
              Live · IPL 2025
            </span>
          </div>
        </div>

        {/* Right Cockpit Controls */}
        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 md:flex shadow-sm">
            <Cpu className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              ML Engine <span className="text-primary font-semibold">v4.2</span> · SHAP + XGBoost
            </span>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 lg:flex">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-medium text-primary">
              55 ML Features Synced
            </span>
          </div>

          <button
            className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card/60 text-muted-foreground transition hover:bg-card hover:text-foreground hover:border-primary/40 cursor-pointer"
            aria-label="Notifications"
            title="System Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>

          <div className="ml-1 flex items-center gap-2 rounded-full border border-border bg-card/80 p-1 pl-2">
            <span className="text-[11px] font-semibold text-muted-foreground hidden sm:inline">Analyst</span>
            <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-[11px] font-bold text-primary-foreground shadow-sm">
              AI
            </div>
          </div>
        </div>
      </div>

      {/* Radiant header line */}
      <div className="header-gradient-line h-px w-full opacity-90" />
    </header>
  )
}
