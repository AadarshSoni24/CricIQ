"use client"

import { useEffect, useMemo, useState } from "react"
import { type Team, type Venue, API_BASE } from "@/lib/cric-data"
import { TeamLogo } from "./team-logo"
import {
  CricketBall,
  CoinIcon,
  StadiumIcon,
  PitchLines,
  CricketHelmet,
} from "./cricket-icons"
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Droplets,
  Flame,
  Home,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react"
import { CountUp } from "./count-up"
import { cn } from "@/lib/utils"
import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from "recharts"

type TossDecision = "Bat" | "Bowl"

type Prediction = {
  homeWin: number
  awayWin: number
  confidence: number
  shap: { label: string; impact: number; icon: "bat" | "ball" | "venue" | "toss" | "form" }[]
  insights?: string[]
  venueInfo?: any
}

export function MatchPredictor() {
  const [teams, setTeams] = useState<Team[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [home, setHome] = useState<Team | null>(null)
  const [away, setAway] = useState<Team | null>(null)
  const [venue, setVenue] = useState<Venue | null>(null)
  const [tossWinner, setTossWinner] = useState<Team | null>(null)
  const [tossDecision, setTossDecision] = useState<TossDecision>("Bowl")
  const [pred, setPred] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const [tRes, vRes] = await Promise.all([
          fetch(`${API_BASE}/teams`),
          fetch(`${API_BASE}/venues`)
        ])
        const tData = await tRes.json()
        const vData = await vRes.json()
        setTeams(tData)
        setVenues(vData)
        setHome(tData[0])
        setAway(tData[1])
        setVenue(vData[0])
        setTossWinner(tData[0])
      } catch (err) {
        console.error("Failed to load initial data", err)
      }
    }
    init()
  }, [])

  const tossOptions = useMemo(() => (home && away ? [home, away] : []), [home, away])

  const handlePredict = async () => {
    if (!home || !away || !venue || !tossWinner) return
    setLoading(true)
    setPred(null)
    setError(null)

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team1: home.name,
          team2: away.name,
          venue: venue.name,
          tossWinner: tossWinner.name,
          tossDecision: tossDecision.toLowerCase(),
        }),
      })

      if (!res.ok) throw new Error("Backend inference failed")

      const data = await res.json()

      setPred({
        homeWin: data.team1WinProb,
        awayWin: data.team2WinProb,
        confidence: data.confidence,
        shap: (data.shapFactors || []).map((f: any) => ({
          label: f.plainText?.split(" (")[0] || f.factor,
          impact: Number((f.impact * 10).toFixed(1)),
          icon: f.factor?.includes("venue") ? "venue" : f.factor?.includes("toss") ? "toss" : "form",
        })),
        insights: data.insights || [],
        venueInfo: data.venueInfo || null,
      })
    } catch (err) {
      console.error(err)
      setError("Model connection failed. Please ensure backend services are running.")
    } finally {
      setLoading(false)
    }
  }

  if (!home || !away || !venue || !tossWinner) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Match Predictor"
        title="Forecast tonight's verdict"
        subtitle="Pick teams, venue and toss. Our model returns win probability, confidence and the factors driving the call."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <TeamSelector side="home" team={home} teams={teams} onChange={setHome} disabledId={away.id} />

        <div className="relative grid place-items-center">
          <div className="relative grid h-20 w-20 place-items-center rounded-full border border-border bg-card shadow-[0_20px_40px_-20px_rgba(0,212,170,0.4)]">
            <span className="absolute inset-1 rounded-full border border-dashed border-primary/40 animate-spin-slow" />
            <CricketBall className="h-9 w-9 text-secondary" />
            <span className="absolute -bottom-2 rounded-full border border-border bg-background px-2 py-0.5 font-display text-[10px] font-bold tracking-[0.2em] text-muted-foreground">
              VS
            </span>
          </div>
        </div>

        <TeamSelector side="away" team={away} teams={teams} onChange={setAway} disabledId={home.id} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <StadiumIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Venue
              </div>
              <div className="font-display text-base font-semibold">{venue.name}</div>
              <div className="text-xs text-muted-foreground">{venue.city}</div>
            </div>
          </div>
          <div className="mt-4 grid max-h-40 grid-cols-3 gap-2 overflow-y-auto pr-1">
            {venues.map((v) => (
              <button
                key={v.id || v.name}
                onClick={() => setVenue(v)}
                className={cn(
                  "rounded-lg border px-2.5 py-2 text-left text-[11px] transition",
                  (venue.id === v.id || venue.name === v.name)
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="truncate font-medium">{v.shortName || v.name.split(",")[0]}</div>
                <div className="truncate text-[10px] text-muted-foreground">{v.city}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
            <Stat label="Avg score" value={venue.avgScore} />
            <Stat label="Bat 1st win%" value={venue.batFirstWin} suffix="%" />
            <Stat label="Pitch" value={venue.pitch} isString />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-lg bg-secondary/10 text-secondary ring-1 ring-secondary/30">
              <CoinIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Toss
              </div>
              <div className="font-display text-base font-semibold">
                {tossWinner.short} chose to {tossDecision.toLowerCase()}
              </div>
              <div className="text-xs text-muted-foreground">Coin flip outcome</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Winner
              </div>
              <div className="grid grid-cols-2 gap-2">
                {tossOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTossWinner(t)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                      tossWinner.id === t.id
                        ? "border-primary/40 bg-primary/5 text-foreground"
                        : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <TeamLogo team={t} size="sm" />
                    <span>{t.short}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Decision
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["Bat", "Bowl"] as TossDecision[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setTossDecision(d)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
                      tossDecision === d
                        ? "border-secondary/50 bg-secondary/10 text-foreground"
                        : "border-border bg-background/40 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {d === "Bat" ? (
                      <PitchLines className="h-4 w-4" />
                    ) : (
                      <CricketBall className="h-4 w-4" />
                    )}
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          onClick={handlePredict}
          disabled={loading}
          className={cn(
            "gradient-cta group relative inline-flex items-center gap-3 rounded-xl px-7 py-3.5 font-display text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground transition active:scale-[0.99]",
            loading && "opacity-80 pointer-events-none"
          )}
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Analyzing Data…" : "Predict Winner"}
        </button>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-xs text-destructive animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
      </div>

      {pred && (
        <div key={`${home.id}-${away.id}-${venue.id}-${tossWinner.id}-${tossDecision}`} className="space-y-4 animate-rise">
          <div className="glass-card rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-display text-sm font-semibold tracking-wide">
                  Win probability
                </span>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] text-primary">
                MODEL v4.2
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TeamLogo team={home} size="sm" />
                <span className="font-display font-semibold">{home.short}</span>
                <span className="font-mono tabular-nums text-foreground">
                  <CountUp value={pred.homeWin} suffix="%" />
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums text-foreground">
                  <CountUp value={pred.awayWin} suffix="%" />
                </span>
                <span className="font-display font-semibold">{away.short}</span>
                <TeamLogo team={away} size="sm" />
              </div>
            </div>

            <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-background ring-1 ring-border">
              <div
                className="animate-fill-bar absolute inset-y-0 left-0 rounded-l-full"
                style={{
                  width: `${pred.homeWin}%`,
                  background: `linear-gradient(90deg, ${home.primary}, ${home.secondary})`,
                }}
              />
              <div
                className="animate-fill-bar absolute inset-y-0 right-0 rounded-r-full"
                style={{
                  width: `${pred.awayWin}%`,
                  background: `linear-gradient(270deg, ${away.primary}, ${away.secondary})`,
                  animationDelay: "120ms",
                }}
              />
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border/80" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <ConfidenceGauge value={pred.confidence} />
            <ShapPanel
              shap={pred.shap}
              winnerName={pred.homeWin >= pred.awayWin ? home.name : away.name}
            />
          </div>

          {pred.insights && pred.insights.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-chart-3" />
                <span className="font-display text-sm font-semibold">Key Insights & Factors</span>
              </div>
              <div className="flex flex-col gap-2">
                {pred.insights.map((insight: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InsightCard
              icon={<PitchLines className="h-5 w-5" />}
              label="Pitch type"
              value={pred.venueInfo?.pitch_dna === 'batting_friendly' ? '🏏 Batting' : pred.venueInfo?.pitch_dna === 'bowling_friendly' ? '🎳 Bowling' : venue.pitch || '⚖️ Balanced'}
              tone="primary"
            />
            <InsightCard
              icon={<Droplets className="h-5 w-5" />}
              label="Avg 1st Innings"
              value={pred.venueInfo?.avg_1st_innings ? `${pred.venueInfo.avg_1st_innings.toFixed(0)}` : venue.avgScore?.toString() || 'N/A'}
              tone="secondary"
            />
            <InsightCard
              icon={<Home className="h-5 w-5" />}
              label="Bat first win%"
              value={pred.venueInfo?.bat_first_win_pct ? `${(pred.venueInfo.bat_first_win_pct * 100).toFixed(0)}%` : 'N/A'}
              tone="primary"
            />
            <InsightCard
              icon={<Flame className="h-5 w-5" />}
              label="Matches at venue"
              value={pred.venueInfo?.matches_played?.toString() || 'N/A'}
              tone="secondary"
            />
          </div>
        </div>
      )}
    </section>
  )
}

function TeamSelector({
  side,
  team,
  teams,
  onChange,
  disabledId,
}: {
  side: "home" | "away"
  team: Team
  teams: Team[]
  onChange: (t: Team) => void
  disabledId?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="glass-card relative overflow-hidden rounded-2xl p-5"
      style={{
        backgroundImage: `linear-gradient(135deg, ${team.primary}22 0%, transparent 60%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 w-1"
        style={{
          [side === "home" ? "left" : "right"]: 0,
          background: `linear-gradient(180deg, ${team.primary}, ${team.secondary})`,
        } as React.CSSProperties}
      />
      <div className="flex items-center justify-between">
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {side === "home" ? "Home" : "Away"}
        </span>
        <span className="rounded-full border border-border bg-background/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
          {team.city}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <TeamLogo team={team} size="lg" />
        <div className="min-w-0">
          <div className="font-display text-xl font-bold leading-tight text-foreground">
            {team.name}
          </div>
        </div>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-5 flex w-full items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <span>Change team</span>
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2 grid max-h-56 grid-cols-2 gap-1.5 overflow-auto rounded-lg border border-border bg-popover p-2">
          {teams.map((t) => (
            <button
              key={t.id}
              disabled={t.id === disabledId}
              onClick={() => {
                onChange(t)
                setOpen(false)
              }}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition",
                t.id === team.id
                  ? "bg-primary/10 text-foreground ring-1 ring-primary/30"
                  : "hover:bg-card",
                t.id === disabledId && "cursor-not-allowed opacity-40",
              )}
            >
              <TeamLogo team={t} size="sm" />
              <span className="truncate">{t.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string, title: string, subtitle: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</span>
      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function Stat({ label, value, suffix, isString }: { label: string, value: number | string, suffix?: string, isString?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-semibold tabular-nums">
        {isString ? <span>{value}</span> : <CountUp value={Number(value)} suffix={suffix} />}
      </div>
    </div>
  )
}

function ConfidenceGauge({ value }: { value: number }) {
  const data = [{ name: "c", value }]
  const tone = value >= 75 ? "#00d4aa" : value >= 55 ? "#f59e0b" : "#ef4444"
  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-5">
      <div className="mb-2 flex w-full items-center justify-between"><span className="font-display text-sm font-semibold">Model confidence</span></div>
      <div className="relative h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="95%" innerRadius="78%" outerRadius="118%" startAngle={180} endAngle={0} data={data}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background={{ fill: "#1f2937" }} dataKey="value" cornerRadius={10} fill={tone} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="font-display text-3xl font-bold tabular-nums" style={{ color: tone }}><CountUp value={value} suffix="%" /></span>
          <span className="text-[11px] text-muted-foreground">{value >= 75 ? "High" : value >= 55 ? "Moderate" : "Low"} confidence</span>
        </div>
      </div>
    </div>
  )
}

function ShapPanel({ shap, winnerName }: { shap: any[], winnerName: string }) {
  const max = Math.max(...shap.map((s) => Math.abs(s.impact)), 1)
  const iconFor = (k: string) => {
    if (k === "ball") return <CricketBall className="h-3.5 w-3.5" />
    if (k === "venue") return <StadiumIcon className="h-3.5 w-3.5" />
    if (k === "toss") return <CoinIcon className="h-3.5 w-3.5" />
    if (k === "form") return <TrendingUp className="h-3.5 w-3.5" />
    return <CricketHelmet className="h-3.5 w-3.5" />
  }
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-display text-sm font-semibold">Why we're calling it</div>
          <div className="text-xs text-muted-foreground">Top factors for <span className="text-foreground">{winnerName}</span></div>
        </div>
      </div>
      <ul className="space-y-2">
        {shap.map((s, i) => {
          const positive = s.impact >= 0
          const width = (Math.abs(s.impact) / max) * 50
          return (
            <li key={i} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <span className={cn("grid h-7 w-7 place-items-center rounded-md ring-1", positive ? "bg-primary/10 text-primary ring-primary/20" : "bg-destructive/10 text-destructive ring-destructive/20")}>{iconFor(s.icon)}</span>
              <span className="flex-1 truncate text-sm text-foreground">{s.label}</span>
              <div className="relative h-1.5 w-1/2 max-w-[260px] overflow-hidden rounded-full bg-background">
                <span className="absolute inset-y-0 left-1/2 w-px bg-border" />
                <span className="animate-fill-bar absolute inset-y-0" style={{ width: `${width}%`, [positive ? "left" : "right"]: "50%", background: positive ? "var(--primary)" : "var(--destructive)" } as React.CSSProperties} />
              </div>
              <span className={cn("flex w-12 items-center justify-end gap-1 font-mono text-xs tabular-nums", positive ? "text-primary" : "text-destructive")}>
                {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(s.impact)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function InsightCard({ icon, label, value, tone }: { icon: React.ReactNode, label: string, value: string, tone: "primary" | "secondary" }) {
  return (
    <div className="glass-card group flex items-center gap-3 rounded-xl p-4 transition hover:translate-y-[-1px]">
      <div className={cn("grid h-10 w-10 place-items-center rounded-lg ring-1", tone === "primary" ? "bg-primary/10 text-primary ring-primary/20" : "bg-secondary/10 text-secondary ring-secondary/30")}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate font-display text-base font-semibold">{value}</div>
      </div>
    </div>
  )
}
