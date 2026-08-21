"use client"

import { useEffect, useMemo, useState } from "react"
import { type Player, API_BASE } from "@/lib/cric-data"
import { CountUp } from "./count-up"
import { cn } from "@/lib/utils"
import { ScoreRing } from "./score-ring"
import {
  Search,
  Trophy,
  Target,
  TrendingUp,
  LayoutDashboard,
  Clock,
  Zap,
  Activity,
  Award,
  BarChart3,
  Layers,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown,
  Minus,
} from "lucide-react"
import { CricketBat, CricketBall, CricketHelmet, StadiumIcon } from "./cricket-icons"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type TabKey = "overview" | "phase" | "venue" | "matchup" | "trend"
type RoleFilter = "All" | "Batter" | "Bowler" | "All-rounder" | "Wicket-keeper"

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: "Skill & Aggregates", icon: LayoutDashboard },
  { key: "phase", label: "Phase Splits", icon: Target },
  { key: "venue", label: "Venue Telemetry", icon: Clock },
  { key: "matchup", label: "vs Bowler Types", icon: Zap },
  { key: "trend", label: "Career Trajectory", icon: TrendingUp },
]

export function PlayerScout() {
  const [players, setPlayers] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All")
  const [active, setActive] = useState<any>(null)
  const [tab, setTab] = useState<TabKey>("overview")
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch(`${API_BASE}/players/list`)
        const data = await res.json()

        let list: any[] = []
        if (data.batters || data.bowlers) {
          list.push(...(data.batters || []).map((name: string) => ({ name, role: "Batter", team: "IPL" })))
          list.push(...(data.bowlers || []).map((name: string) => ({ name, role: "Bowler", team: "IPL" })))
        } else if (data.players) {
          list = data.players.map((name: string) => ({ name, role: "Player", team: "IPL" }))
        }

        setPlayers(list)
        if (list.length > 0) setActive(list[0])
      } catch (err) {
        console.error("Failed to load player list", err)
      } finally {
        setInitLoading(false)
      }
    }
    fetchList()
  }, [])

  const fetchPlayerDetails = async (p: any) => {
    if (!p) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/players/${encodeURIComponent(p.name)}`)
      if (!res.ok) throw new Error("Scout data failed")
      const data = await res.json()
      setDetails(data)
    } catch (err) {
      console.error(err)
      setDetails(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (active) fetchPlayerDetails(active)
  }, [active])

  const results = useMemo(() => {
    if (!Array.isArray(players)) return []
    let list = players
    if (roleFilter !== "All") {
      list = list.filter((p) => p.role === roleFilter)
    }
    const q = query.toLowerCase()
    if (!q) return list.slice(0, 40)
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.role?.toLowerCase().includes(q) ||
          p.team?.toLowerCase().includes(q),
      )
      .slice(0, 50)
  }, [query, players, roleFilter])

  if (initLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="font-mono text-xs text-muted-foreground">Loading Scouting Intelligence Database…</span>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Player Scout"
        title="Tactical Player Profiling & Scouting IQ"
        subtitle="Analyze player archetypes, phase strike rates, venue mastery, and bowling type matchups converted into a unified 100-point scouting score."
      />

      {/* Search & Filter Cockpit */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by player name, role, or team franchise…"
              className="w-full rounded-xl border border-border bg-background/60 py-2.5 pl-10 pr-4 text-xs sm:text-sm placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
            />
          </div>

          {/* Role Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            {(["All", "Batter", "Bowler"] as RoleFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0",
                  roleFilter === r
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground border border-border/80",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Player Roster Pills Carousel */}
        <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
          {results.map((p) => {
            const isSelected = active?.name === p.name
            return (
              <button
                key={p.name}
                onClick={() => setActive(p)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all cursor-pointer",
                  isSelected
                    ? "border-primary/60 bg-primary/15 text-foreground ring-1 ring-primary/40 font-bold"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:bg-background/80 hover:text-foreground",
                )}
              >
                <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 font-display text-[9px] font-bold text-foreground">
                  {p.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
                </span>
                <span className="truncate max-w-[130px]">{p.name}</span>
                <span className="rounded-md bg-background/60 px-1.5 py-0.5 text-[9.5px] text-muted-foreground">
                  {p.role}
                </span>
              </button>
            )
          })}
          {results.length === 0 && (
            <div className="text-xs text-muted-foreground py-2 pl-1">No players matched your search.</div>
          )}
        </div>
      </div>

      {/* Main Scouting Dashboard Bento Grid */}
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* Left Column: Player Scout Hero Profile */}
        <div className={cn("transition-opacity duration-200", loading && "opacity-60")}>
          {active && <PlayerCard player={active} details={details} />}
        </div>

        {/* Right Column: Deep Analytics Tabs */}
        <div className="space-y-4">
          {/* Sub Navigation Bar */}
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border/80 bg-card/60 p-1.5 backdrop-blur-md">
            {TABS.map((t) => {
              const Icon = t.icon
              const isActive = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer",
                    isActive
                      ? "bg-background text-foreground ring-1 ring-primary/40 shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border bg-card/20">
              <div className="flex flex-col items-center gap-2.5">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Querying ML Feature Store for {active?.name}…
                </span>
              </div>
            </div>
          )}

          {/* Tab Views */}
          {!loading && tab === "overview" && <OverviewTab player={active} details={details} />}
          {!loading && tab === "phase" && <PhaseTab details={details} />}
          {!loading && tab === "venue" && <VenueTab details={details} />}
          {!loading && tab === "matchup" && <MatchupTab details={details} />}
          {!loading && tab === "trend" && <TrendTab details={details} />}
        </div>
      </div>
    </section>
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

function PlayerCard({ player, details }: { player: any; details: any }) {
  const score = details?.scoutingScore || player.score || 72
  const RoleIcon = player.role?.includes("Bowler")
    ? CricketBall
    : player.role?.includes("All")
      ? CricketHelmet
      : CricketBat

  const archetype = details?.archetype || "Aggressor"
  const fairValue = ((score / 10) * 1.25).toFixed(1)

  return (
    <div className="glass-card relative overflow-hidden rounded-2xl p-6 space-y-5">
      {/* Top Banner with Score */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              ML Scouting Profile
            </span>
          </div>
          <h3 className="mt-1 font-display text-2xl font-extrabold leading-tight text-foreground truncate max-w-[210px]">
            {player.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>{player.team || "IPL"}</span>
            <span className="text-border">·</span>
            <span className="text-foreground">{archetype}</span>
          </div>
        </div>
        <ScoreRing value={score} size="md" />
      </div>

      {/* Role & Archetype Badges */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-display text-xs font-bold tracking-wide text-primary shadow-sm">
          <RoleIcon className="h-3.5 w-3.5" />
          {player.role || "Player"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 font-display text-xs font-bold tracking-wide text-secondary shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          {archetype}
        </span>
      </div>

      {/* Key Career Stats Row */}
      <div className="grid grid-cols-3 gap-2.5 border-t border-border/80 pt-4 text-center">
        <Stat label="Total Runs" value={details?.profile?.totalRuns || 0} />
        <Stat label="Strike Rate" value={details?.profile?.overallSR || 0} decimals={1} />
        <Stat label="Bat Avg" value={details?.profile?.overallAvg || 0} decimals={1} />
      </div>

      {/* Fair Value Cockpit Card */}
      <div className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/10 via-background/40 to-background/60 p-4 text-center shadow-inner">
        <span className="text-[10px] font-bold uppercase tracking-wider text-secondary block">
          Calculated Fair Market Value
        </span>
        <div className="font-display text-3xl font-extrabold text-foreground mt-1 tabular-nums">
          ₹{fairValue} <span className="text-sm font-bold text-muted-foreground">Cr</span>
        </div>
        <span className="text-[10.5px] text-muted-foreground mt-1 block">
          Predicted auction ceiling based on 55 ML performance parameters
        </span>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  decimals = 0,
  suffix,
}: {
  label: string
  value: number
  decimals?: number
  suffix?: string
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/30 p-2.5">
      <div className="text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-base font-bold tabular-nums text-foreground mt-0.5">
        <CountUp value={value} decimals={decimals} suffix={suffix} />
      </div>
    </div>
  )
}

function OverviewTab({ player, details }: { player: any; details: any }) {
  const radar = [
    { metric: "Power Rating", value: Math.round(details?.profile?.intentScore ? Math.min(100, details.profile.intentScore / 1.5) : 75) },
    { metric: "Consistency", value: Math.round(details?.profile?.consistency ? details.profile.consistency * 100 : 70) },
    { metric: "vs Spin Attack", value: Math.round(details?.profile?.srVsSpin ? Math.min(100, (details.profile.srVsSpin / 175) * 100) : 78) },
    { metric: "vs Pace Attack", value: Math.round(details?.profile?.srVsPace ? Math.min(100, (details.profile.srVsPace / 175) * 100) : 82) },
    { metric: "Overall IQ Score", value: Math.round(details?.scoutingScore || 74) },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Aggregates Box */}
      <div className="glass-card flex flex-col justify-between rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-sm font-bold text-foreground">Season Aggregates</span>
          <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
            IPL Telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Boundary %</span>
            <div className="font-display text-xl font-bold text-primary mt-1">
              <CountUp value={details?.profile?.boundaryPct || 0} decimals={1} suffix="%" />
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Dot Ball %</span>
            <div className="font-display text-xl font-bold text-secondary mt-1">
              <CountUp value={details?.profile?.dotPct || 0} decimals={1} suffix="%" />
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Innings Played</span>
            <div className="font-display text-xl font-bold text-foreground mt-1">
              <CountUp value={details?.profile?.totalInnings || 0} />
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Intent Index</span>
            <div className="font-display text-xl font-bold text-chart-3 mt-1">
              <CountUp value={details?.profile?.intentScore || 0} decimals={1} />
            </div>
          </div>
        </div>
      </div>

      {/* Skill Bar Breakdown */}
      <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-sm font-bold text-foreground">Skill Dimension Ratings</span>
          <span className="text-[10px] text-muted-foreground uppercase font-bold">Max 100</span>
        </div>

        <ul className="space-y-3">
          {radar.map((r) => (
            <li key={r.metric} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">{r.metric}</span>
                <span className="font-mono text-xs font-bold text-foreground tabular-nums">
                  <CountUp value={r.value} />/100
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-background/80 ring-1 ring-border">
                <span
                  className="animate-fill-bar absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${r.value}%`,
                    background:
                      r.value >= 80
                        ? "linear-gradient(90deg, #00e599, #10b981)"
                        : r.value >= 65
                          ? "linear-gradient(90deg, #38bdf8, #00e599)"
                          : "linear-gradient(90deg, #ffb800, #f59e0b)",
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function PhaseTab({ details }: { details: any }) {
  const data = details?.phases
    ? [
        { phase: "Powerplay (1-6)", sr: Math.round(details.phases.powerplay?.sr || 0) },
        { phase: "Middle Overs (7-15)", sr: Math.round(details.phases.middle?.sr || 0) },
        { phase: "Death Overs (16-20)", sr: Math.round(details.phases.death?.sr || 0) },
      ]
    : []

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-display text-sm font-bold text-foreground block">Match Phase Strike Rates</span>
          <span className="text-xs text-muted-foreground">Scoring rate across match progression</span>
        </div>
        <span className="rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[10px] text-primary">
          Phase Telemetry
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="phase" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "#0d1322",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
              labelStyle={{ color: "#f8fafc", fontWeight: "bold" }}
            />
            <Bar dataKey="sr" name="Strike Rate" radius={[8, 8, 0, 0]} fill="#00e599" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function VenueTab({ details }: { details: any }) {
  const venues = details?.venueStats || details?.venues || []
  if (!venues.length) {
    return (
      <div className="glass-card rounded-2xl p-5 text-center py-16">
        <StadiumIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
        <div className="text-muted-foreground text-xs">No stadium venue records logged for this player profile.</div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="font-display text-sm font-bold mb-4 text-foreground">Venue Specific Performance</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {venues.slice(0, 6).map((v: any, i: number) => (
          <div key={i} className="rounded-xl border border-border/70 bg-background/50 p-3.5 transition hover:border-primary/40">
            <div className="font-semibold text-xs text-foreground truncate">{v.venue || v.name}</div>
            <div className="mt-2.5 grid grid-cols-3 gap-2 text-center border-t border-border/50 pt-2">
              <div>
                <div className="text-[9.5px] text-muted-foreground uppercase">Runs</div>
                <div className="font-display text-sm font-bold text-foreground">{v.runs || 0}</div>
              </div>
              <div>
                <div className="text-[9.5px] text-muted-foreground uppercase">SR</div>
                <div className="font-display text-sm font-bold text-primary">{v.sr?.toFixed(1) || "0"}</div>
              </div>
              <div>
                <div className="text-[9.5px] text-muted-foreground uppercase">Inns</div>
                <div className="font-display text-sm font-bold text-secondary">{v.innings || v.matches || 0}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchupTab({ details }: { details: any }) {
  const profile = details?.profile
  if (!profile) {
    return (
      <div className="glass-card rounded-2xl p-5 text-center py-16 text-muted-foreground text-xs">
        <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
        Select a player to view bowling-type matchup telemetry.
      </div>
    )
  }

  const matchupData = [
    { type: "vs Spin Attackers", sr: profile.srVsSpin || 128.5, color: "#a855f7" },
    { type: "vs Pace Attackers", sr: profile.srVsPace || 142.2, color: "#38bdf8" },
  ]

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="font-display text-sm font-bold text-foreground">Bowling Type Dominance</div>
      <div className="grid gap-4 sm:grid-cols-2">
        {matchupData.map((m) => (
          <div
            key={m.type}
            className="rounded-2xl border border-border/80 bg-background/50 p-4 transition-all"
            style={{ borderLeftColor: m.color, borderLeftWidth: 4 }}
          >
            <div className="text-xs font-semibold text-muted-foreground">{m.type}</div>
            <div className="font-display text-3xl font-extrabold mt-1.5 tabular-nums" style={{ color: m.color }}>
              {m.sr.toFixed(1)}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Average Strike Rate</div>
          </div>
        ))}
      </div>

      {(profile.boundaryPct || profile.dotPct) && (
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <div className="rounded-xl border border-border/60 bg-background/40 p-3.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Boundary %</div>
            <div className="font-display text-xl font-extrabold text-primary mt-1">
              {profile.boundaryPct?.toFixed(1) || 0}%
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-3.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dot Ball %</div>
            <div className="font-display text-xl font-extrabold text-secondary mt-1">
              {profile.dotPct?.toFixed(1) || 0}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TrendTab({ details }: { details: any }) {
  const trend = details?.seasonTrend || "improving"
  const score = details?.scoutingScore || 75
  const archetype = details?.archetype || "Aggressor"
  const isRising = trend === "improving"
  const isDeclining = trend === "declining"

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="font-display text-sm font-bold text-foreground">Form & Career Trajectory</div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-background/50 p-4 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scouting Rating</div>
          <div
            className="font-display text-3xl font-extrabold mt-1.5 tabular-nums"
            style={{ color: score >= 75 ? "#00e599" : score >= 60 ? "#ffb800" : "#94a3b8" }}
          >
            {score.toFixed(0)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">out of 100 IQ</div>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/50 p-4 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Form Trajectory</div>
          <div className="flex items-center justify-center gap-1 mt-1.5">
            {isRising ? (
              <ArrowUpRight className="h-7 w-7 text-primary" />
            ) : isDeclining ? (
              <TrendingDown className="h-7 w-7 text-destructive" />
            ) : (
              <Minus className="h-7 w-7 text-secondary" />
            )}
          </div>
          <div className="text-xs font-bold mt-1 capitalize text-foreground">{trend}</div>
        </div>

        <div className="rounded-xl border border-border/70 bg-background/50 p-4 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">T20 Archetype</div>
          <div className="font-display text-base font-bold mt-2 text-primary truncate">{archetype}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Role Classification</div>
        </div>
      </div>
    </div>
  )
}
