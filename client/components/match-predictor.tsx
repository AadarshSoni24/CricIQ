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
  CricketBat,
} from "./cricket-icons"
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Droplets,
  Flame,
  Home,
  Info,
  Layers,
  Search,
  Sparkles,
  Swords,
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
  const [venueSearch, setVenueSearch] = useState("")

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
        if (tData.length > 0) {
          setHome(tData[0])
          setAway(tData[1] || tData[0])
          setTossWinner(tData[0])
        }
        if (vData.length > 0) {
          setVenue(vData[0])
        }
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

      if (!res.ok) throw new Error("Prediction request failed")

      const data = await res.json()

      setPred({
        homeWin: Math.round(data.team1WinProb),
        awayWin: Math.round(data.team2WinProb),
        confidence: Math.round(data.confidence || 75),
        shap: (data.shapFactors || []).map((f: any) => ({
          label: f.plainText?.split(" (")[0] || f.factor,
          impact: Number((f.impact * 10).toFixed(1)),
          icon: f.factor?.includes("venue")
            ? "venue"
            : f.factor?.includes("toss")
              ? "toss"
              : f.factor?.includes("form")
                ? "form"
                : "bat",
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

  const filteredVenues = useMemo(() => {
    if (!venueSearch) return venues
    return venues.filter(
      (v) =>
        v.name.toLowerCase().includes(venueSearch.toLowerCase()) ||
        v.city?.toLowerCase().includes(venueSearch.toLowerCase())
    )
  }, [venues, venueSearch])

  if (!home || !away || !venue || !tossWinner) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="font-mono text-xs text-muted-foreground">Initializing CricIQ Match Telemetry…</span>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-7">
      <PageHeading
        eyebrow="Match Predictor"
        title="Predict Tonight's Match Winner"
        subtitle="Configure team rosters, venue characteristics, and toss outcome. The AI ensemble combines LightGBM, XGBoost, and SHAP explainability for instant win probability."
      />

      {/* Arena Team Selector */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] items-center">
        <TeamSelector side="home" team={home} teams={teams} onChange={setHome} disabledId={away.id} />

        {/* Central Glowing VS Emblem */}
        <div className="relative grid place-items-center my-2 lg:my-0">
          <div className="relative grid h-20 w-20 place-items-center rounded-full border border-border/80 bg-card shadow-[0_0_30px_-5px_rgba(0,229,153,0.3)]">
            <span className="absolute inset-1 rounded-full border border-dashed border-primary/40 animate-spin-slow" />
            <CricketBall className="h-8 w-8 text-secondary drop-shadow-[0_0_10px_rgba(255,184,0,0.5)]" />
            <span className="absolute -bottom-2.5 rounded-full border border-primary/30 bg-background/95 px-2.5 py-0.5 font-display text-[10px] font-extrabold tracking-[0.25em] text-primary shadow-sm">
              VS
            </span>
          </div>
        </div>

        <TeamSelector side="away" team={away} teams={teams} onChange={setAway} disabledId={home.id} />
      </div>

      {/* Venue & Toss Bento Controls */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Venue Selector Card */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25 shadow-sm">
                  <StadiumIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Selected Stadium
                  </div>
                  <div className="font-display text-base font-bold text-foreground truncate max-w-[240px]">
                    {venue.shortName || venue.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{venue.city}</div>
                </div>
              </div>

              <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-primary">
                {venue.pitch || "Balanced"} Deck
              </span>
            </div>

            {/* Quick search input */}
            <div className="mt-3.5 relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search venue by name or city…"
                value={venueSearch}
                onChange={(e) => setVenueSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background/60 py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
              />
            </div>

            {/* Venues Pill Grid */}
            <div className="mt-3 grid max-h-36 grid-cols-2 sm:grid-cols-3 gap-1.5 overflow-y-auto pr-1">
              {filteredVenues.map((v) => {
                const isSelected = venue.id === v.id || venue.name === v.name
                return (
                  <button
                    key={v.id || v.name}
                    onClick={() => setVenue(v)}
                    className={cn(
                      "rounded-lg border px-2.5 py-2 text-left text-[11px] transition-all cursor-pointer",
                      isSelected
                        ? "border-primary/60 bg-primary/15 text-foreground ring-1 ring-primary/30 font-medium"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:bg-background/80 hover:text-foreground hover:border-border",
                    )}
                  >
                    <div className="truncate font-medium">{v.shortName || v.name.split(",")[0]}</div>
                    <div className="truncate text-[9.5px] text-muted-foreground">{v.city}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/80 pt-3.5 text-center">
            <Stat label="Avg 1st Score" value={venue.avgScore || 168} />
            <Stat label="Bat 1st Win" value={venue.batFirstWin || 52} suffix="%" />
            <Stat label="Pitch Bias" value={venue.pitch || "Balanced"} isString />
          </div>
        </div>

        {/* Toss Intelligence Card */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/10 text-secondary ring-1 ring-secondary/30 shadow-sm">
                  <CoinIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Toss Setup
                  </div>
                  <div className="font-display text-base font-bold text-foreground">
                    {tossWinner.short} elected to {tossDecision.toLowerCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">Simulate coin flip impact</div>
                </div>
              </div>

              <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-secondary">
                Toss Weight ~12%
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3.5">
              {/* Toss Winner Picker */}
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Toss Winner
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {tossOptions.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTossWinner(t)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer",
                        tossWinner.id === t.id
                          ? "border-primary/60 bg-primary/15 text-foreground ring-1 ring-primary/40 shadow-sm"
                          : "border-border/70 bg-background/50 text-muted-foreground hover:bg-background/80 hover:text-foreground",
                      )}
                    >
                      <TeamLogo team={t} size="sm" />
                      <span>{t.short}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toss Decision Picker */}
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Elected Decision
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["Bat", "Bowl"] as TossDecision[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setTossDecision(d)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer",
                        tossDecision === d
                          ? "border-secondary/60 bg-secondary/15 text-foreground ring-1 ring-secondary/40 shadow-sm"
                          : "border-border/70 bg-background/50 text-muted-foreground hover:bg-background/80 hover:text-foreground",
                      )}
                    >
                      {d === "Bat" ? (
                        <CricketBat className="h-4 w-4 text-secondary" />
                      ) : (
                        <CricketBall className="h-4 w-4 text-secondary" />
                      )}
                      <span>{d}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-background/30 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
            <Info className="h-4 w-4 text-primary shrink-0" />
            <span>Toss winning teams batting second at night win 58% of games at dew-heavy venues.</span>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex flex-col items-center gap-3 pt-1">
        <button
          onClick={handlePredict}
          disabled={loading}
          className={cn(
            "gradient-cta group relative inline-flex items-center gap-3 rounded-2xl px-9 py-4 font-display text-sm font-extrabold uppercase tracking-[0.2em] text-primary-foreground shadow-lg transition active:scale-[0.98] cursor-pointer",
            loading && "opacity-80 pointer-events-none"
          )}
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Sparkles className="h-5 w-5 drop-shadow" />
          )}
          {loading ? "Running Ensemble Inference…" : "Predict Match Outcome"}
        </button>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs text-destructive animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
      </div>

      {/* Prediction Output Dashboard */}
      {pred && (
        <div key={`${home.id}-${away.id}-${venue.id}-${tossWinner.id}-${tossDecision}`} className="space-y-5 animate-rise">
          {/* Main Win Probability Banner */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-display text-base font-bold tracking-wide">
                    Win Probability Projection
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    Simulated over 10,000 algorithmic match iterations
                  </span>
                </div>
              </div>

              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[11px] font-bold text-primary shadow-sm">
                AI CONFIDENCE {pred.confidence}%
              </span>
            </div>

            {/* Probability Faceoff */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <TeamLogo team={home} size="md" />
                <div>
                  <span className="font-display text-lg font-bold text-foreground block">{home.name}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-3xl font-extrabold text-primary tabular-nums">
                      <CountUp value={pred.homeWin} suffix="%" />
                    </span>
                    {pred.homeWin >= pred.awayWin && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded-md">
                        Favorite (+{(pred.homeWin - pred.awayWin)}%)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <span className="font-display text-lg font-bold text-foreground block">{away.name}</span>
                  <div className="flex items-baseline justify-end gap-1.5">
                    {pred.awayWin > pred.homeWin && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary bg-secondary/15 px-2 py-0.5 rounded-md">
                        Favorite (+{(pred.awayWin - pred.homeWin)}%)
                      </span>
                    )}
                    <span className="font-mono text-3xl font-extrabold text-secondary tabular-nums">
                      <CountUp value={pred.awayWin} suffix="%" />
                    </span>
                  </div>
                </div>
                <TeamLogo team={away} size="md" />
              </div>
            </div>

            {/* Split Bar */}
            <div className="relative mt-4 h-4 overflow-hidden rounded-full bg-background/80 ring-1 ring-border shadow-inner">
              <div
                className="animate-fill-bar absolute inset-y-0 left-0 rounded-l-full transition-all"
                style={{
                  width: `${pred.homeWin}%`,
                  background: `linear-gradient(90deg, ${home.primary}, ${home.secondary || '#00e599'})`,
                  boxShadow: `0 0 16px ${home.primary}88`,
                }}
              />
              <div
                className="animate-fill-bar absolute inset-y-0 right-0 rounded-r-full transition-all"
                style={{
                  width: `${pred.awayWin}%`,
                  background: `linear-gradient(270deg, ${away.primary}, ${away.secondary || '#ffb800'})`,
                  animationDelay: "100ms",
                  boxShadow: `0 0 16px ${away.primary}88`,
                }}
              />
              <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/40 shadow-sm" />
            </div>
          </div>

          {/* Model Confidence & SHAP Explainability Grid */}
          <div className="grid gap-4 lg:grid-cols-[330px_1fr]">
            <ConfidenceGauge value={pred.confidence} />
            <ShapPanel
              shap={pred.shap}
              winnerName={pred.homeWin >= pred.awayWin ? home.name : away.name}
            />
          </div>

          {/* Tactical AI Insights Box */}
          {pred.insights && pred.insights.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-primary/20">
              <div className="flex items-center gap-2.5 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-display text-sm font-bold text-foreground">
                  AI Tactical Intelligence & Strategic Keys
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {pred.insights.map((insight: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/50 p-3 text-xs leading-relaxed text-foreground"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ground Telemetry Bento Cards */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <InsightCard
              icon={<PitchLines className="h-5 w-5" />}
              label="Pitch Blueprint"
              value={
                pred.venueInfo?.pitch_dna === 'batting_friendly'
                  ? 'Batting Paradise'
                  : pred.venueInfo?.pitch_dna === 'bowling_friendly'
                    ? 'Bowling Minefield'
                    : venue.pitch || 'Balanced Deck'
              }
              sub="Surface DNA"
              tone="primary"
            />
            <InsightCard
              icon={<Droplets className="h-5 w-5" />}
              label="Avg 1st Innings"
              value={
                pred.venueInfo?.avg_1st_innings
                  ? `${pred.venueInfo.avg_1st_innings.toFixed(0)} Runs`
                  : `${venue.avgScore || 168} Runs`
              }
              sub="Par Target"
              tone="secondary"
            />
            <InsightCard
              icon={<Home className="h-5 w-5" />}
              label="Bat First Win %"
              value={
                pred.venueInfo?.bat_first_win_pct
                  ? `${(pred.venueInfo.bat_first_win_pct * 100).toFixed(0)}%`
                  : `${venue.batFirstWin || 52}%`
              }
              sub="Defending Record"
              tone="primary"
            />
            <InsightCard
              icon={<Flame className="h-5 w-5" />}
              label="Venue Sample"
              value={`${pred.venueInfo?.matches_played || 45} Matches`}
              sub="IPL Matches Analyzed"
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
      className="glass-card relative overflow-hidden rounded-2xl p-5 transition-all"
      style={{
        backgroundImage: `linear-gradient(135deg, ${team.primary}22 0%, transparent 65%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 w-1.5"
        style={{
          [side === "home" ? "left" : "right"]: 0,
          background: `linear-gradient(180deg, ${team.primary}, ${team.secondary || team.primary})`,
          boxShadow: `0 0 12px ${team.primary}`,
        } as React.CSSProperties}
      />
      <div className="flex items-center justify-between">
        <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          {side === "home" ? "Home Franchise" : "Away Franchise"}
        </span>
        <span className="rounded-full border border-border/80 bg-background/60 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
          {team.city}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <TeamLogo team={team} size="lg" />
        <div className="min-w-0">
          <div className="font-display text-xl sm:text-2xl font-bold leading-tight text-foreground truncate">
            {team.name}
          </div>
          <span className="font-mono text-xs text-primary/90 font-medium">Franchise IQ · Primary</span>
        </div>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-5 flex w-full items-center justify-between rounded-xl border border-border/80 bg-background/60 px-3.5 py-2.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground hover:border-primary/40 cursor-pointer"
      >
        <span>Switch {side === "home" ? "Home" : "Away"} Team</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-2.5 grid max-h-56 grid-cols-2 gap-1.5 overflow-auto rounded-xl border border-border/90 bg-popover p-2 shadow-2xl">
          {teams.map((t) => (
            <button
              key={t.id}
              disabled={t.id === disabledId}
              onClick={() => {
                onChange(t)
                setOpen(false)
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-all cursor-pointer",
                t.id === team.id
                  ? "bg-primary/20 text-foreground ring-1 ring-primary/40 font-bold"
                  : "hover:bg-card text-muted-foreground hover:text-foreground",
                t.id === disabledId && "cursor-not-allowed opacity-30",
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

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-[11px] font-bold uppercase tracking-[0.25em] text-primary">{eyebrow}</span>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
      <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
    </div>
  )
}

function Stat({ label, value, suffix, isString }: { label: string; value: number | string; suffix?: string; isString?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-base font-bold tabular-nums text-foreground mt-0.5">
        {isString ? <span>{value}</span> : <CountUp value={Number(value)} suffix={suffix} />}
      </div>
    </div>
  )
}

function ConfidenceGauge({ value }: { value: number }) {
  const data = [{ name: "confidence", value }]
  const tone = value >= 75 ? "#00e599" : value >= 55 ? "#ffb800" : "#ef4444"
  const label = value >= 75 ? "High Confidence" : value >= 55 ? "Moderate Confidence" : "High Volatility"

  return (
    <div className="glass-card flex flex-col items-center justify-between rounded-2xl p-5">
      <div className="flex w-full items-center justify-between">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Model Calibration
        </span>
        <span className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold" style={{ color: tone, background: `${tone}15` }}>
          {label}
        </span>
      </div>

      <div className="relative h-44 w-full my-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="95%" innerRadius="78%" outerRadius="118%" startAngle={180} endAngle={0} data={data}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background={{ fill: "rgba(255,255,255,0.06)" }} dataKey="value" cornerRadius={12} fill={tone} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="font-display text-3xl font-extrabold tabular-nums tracking-tight" style={{ color: tone }}>
            <CountUp value={value} suffix="%" />
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">Confidence Metric</span>
        </div>
      </div>

      <div className="text-center text-[10px] text-muted-foreground w-full border-t border-border/60 pt-2">
        Trained on ball-by-ball IPL dataset (2008–2024)
      </div>
    </div>
  )
}

function ShapPanel({ shap, winnerName }: { shap: any[]; winnerName: string }) {
  const max = Math.max(...shap.map((s) => Math.abs(s.impact)), 1)
  const iconFor = (k: string) => {
    if (k === "ball") return <CricketBall className="h-3.5 w-3.5" />
    if (k === "venue") return <StadiumIcon className="h-3.5 w-3.5" />
    if (k === "toss") return <CoinIcon className="h-3.5 w-3.5" />
    if (k === "form") return <TrendingUp className="h-3.5 w-3.5" />
    return <CricketBat className="h-3.5 w-3.5" />
  }

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-display text-sm font-bold text-foreground">SHAP Explainability Breakdown</div>
          <div className="text-xs text-muted-foreground">
            Top feature impacts driving the call for <span className="text-foreground font-semibold">{winnerName}</span>
          </div>
        </div>
        <span className="rounded-md border border-border bg-background/50 px-2 py-1 font-mono text-[10px] text-muted-foreground">
          Feature Weights
        </span>
      </div>

      <ul className="space-y-2">
        {shap.slice(0, 5).map((s, i) => {
          const positive = s.impact >= 0
          const width = Math.min(100, (Math.abs(s.impact) / max) * 100)
          return (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-xs transition-all hover:bg-background/70"
            >
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-lg ring-1",
                  positive
                    ? "bg-primary/15 text-primary ring-primary/30"
                    : "bg-destructive/15 text-destructive ring-destructive/30",
                )}
              >
                {iconFor(s.icon)}
              </span>
              <span className="flex-1 truncate font-medium text-foreground">{s.label}</span>
              
              <div className="relative h-2 w-1/3 max-w-[200px] overflow-hidden rounded-full bg-background/80 ring-1 ring-border">
                <span
                  className="animate-fill-bar absolute inset-y-0 rounded-full"
                  style={{
                    width: `${width}%`,
                    left: positive ? "0" : "auto",
                    right: positive ? "auto" : "0",
                    background: positive ? "#00e599" : "#ef4444",
                  }}
                />
              </div>

              <span
                className={cn(
                  "flex w-14 items-center justify-end gap-0.5 font-mono text-xs font-bold tabular-nums",
                  positive ? "text-primary" : "text-destructive",
                )}
              >
                {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(s.impact).toFixed(1)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function InsightCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  tone: "primary" | "secondary"
}) {
  return (
    <div className="glass-card glass-card-hover group flex items-center gap-3.5 rounded-2xl p-4 transition-all">
      <div
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 shadow-sm",
          tone === "primary"
            ? "bg-primary/10 text-primary ring-primary/25"
            : "bg-secondary/10 text-secondary ring-secondary/30",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate font-display text-base font-bold text-foreground mt-0.5">{value}</div>
        <div className="truncate text-[10px] text-muted-foreground/80">{sub}</div>
      </div>
    </div>
  )
}
