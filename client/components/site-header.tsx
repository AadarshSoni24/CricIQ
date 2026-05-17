import { CricketBat, CricketBall } from "./cricket-icons"
import { Activity, Bell, Settings } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="relative z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 ring-1 ring-primary/30">
            <CricketBat className="h-6 w-6 text-primary" />
            <CricketBall
              className="absolute -bottom-1 -right-1 h-4 w-4 text-secondary drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
              aria-hidden
            />
          </div>
          <div className="leading-tight">
            <div className="font-display text-xl font-bold tracking-wide">
              <span className="text-foreground">Cric</span>
              <span className="text-gradient-primary">IQ</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              IPL Intelligence Platform
            </div>
          </div>
        </div>

        {/* Live badge */}
        <div className="ml-2 hidden items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1.5 sm:flex">
          <span className="relative grid place-items-center">
            <span className="relative h-2 w-2 rounded-full bg-destructive">
              <span className="live-dot" aria-hidden />
            </span>
          </span>
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-destructive">
            Live · IPL 2025
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1.5 md:flex">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              Models <span className="text-primary">·</span> v4.2 synced
            </span>
          </div>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card/60 text-muted-foreground transition hover:bg-card hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card/60 text-muted-foreground transition hover:bg-card hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <div className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-[11px] font-semibold text-primary-foreground">
            AS
          </div>
        </div>
      </div>

      {/* gradient line */}
      <div className="header-gradient-line h-px w-full opacity-80" />
    </header>
  )
}
