"use client" // MERN Integrated

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
} from "lucide-react"
import { CricketBat, CricketBall, CricketHelmet } from "./cricket-icons"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type TabKey = "overview" | "phase" | "venue" | "matchup" | "trend"

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "phase", label: "Phase Stats", icon: Target },
  { key: "venue", label: "Venue Records", icon: Clock },
  { key: "matchup", label: "vs Bowler Types", icon: Zap },
  { key: "trend", label: "Career Trend", icon: TrendingUp },
]

export function PlayerScout() {
  const [players, setPlayers] = useState<any[]>([])
  const [query, setQuery] = useState("")
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
        
        // Handle new registry-based list or legacy format
        const list = (data.players || [])
          .map((name: string) => ({ name, role: "Player", team: "IPL" }))
        
        // Fallback for legacy format if needed
        if (list.length === 0 && (data.batters || data.bowlers)) {
          list.push(...(data.batters || []).map((name: string) => ({ name, role: "Batter", team: "IPL" })))
          list.push(...(data.bowlers || []).map((name: string) => ({ name, role: "Bowler", team: "IPL" })))
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
    const q = query.toLowerCase()
    if (!q) return players.slice(0, 30) // Show up to 30 initially
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.role?.toLowerCase().includes(q) ||
        p.team?.toLowerCase().includes(q),
    ).slice(0, 50) // Cap at 50 to avoid performance issues
  }, [query, players])

  if (initLoading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Player Scout"
        title="Read the player like a coach"
        subtitle="Form, archetype, phase splits and venue records — distilled into a single scouting score."
      />

      <div className="glass-card flex items-center gap-3 rounded-2xl p-2 pl-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players, roles or teams…"
          className="flex-1 bg-transparent py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-2">
        {results.map((p) => (
          <button
            key={p.id || p.name}
            onClick={() => setActive(p)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
              active?.name === p.name
                ? "border-primary/40 bg-primary/5 text-foreground"
                : "border-border bg-card/60 text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 font-display text-[10px] font-bold text-foreground">
              {p.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
            </span>
            <span className="font-medium">{p.name}</span>
            <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {p.team}
            </span>
          </button>
        ))}
        {results.length === 0 && <div className="text-sm text-muted-foreground py-2">No players found.</div>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className={cn("transition-opacity", loading && "opacity-50")}>
          {active && <PlayerCard player={active} details={details} />}
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border bg-card/40 p-1.5">
            {TABS.map((t) => {
              const Icon = t.icon
              const isActive = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition",
                    isActive
                      ? "bg-background text-foreground ring-1 ring-primary/30"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
                  {t.label}
                </button>
              )
            })}
          </div>

          {loading && (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-card/20">
              <div className="flex flex-col items-center gap-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Syncing ML Profile…</span>
              </div>
            </div>
          )}

          {!loading && tab === "overview" && <OverviewTab player={active} details={details} />}
          {!loading && tab === "phase" && <PhaseTab player={active} details={details} />}
          {!loading && tab === "venue" && <VenueTab details={details} />}
          {!loading && tab === "matchup" && <MatchupTab details={details} />}
          {!loading && tab === "trend" && <TrendTab details={details} />}
        </div>
      </div>
    </section>
  )
}

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string, title: string, subtitle: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</span>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}

function PlayerCard({ player, details }: { player: any, details: any }) {
  const score = details?.scoutingScore || player.score || 70
  const RoleIcon = player.role?.includes("Bowler") ? CricketBall : player.role?.includes("All") ? CricketHelmet : CricketBat

  return (
    <div className="glass-card relative overflow-hidden rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Scouting profile</span>
          </div>
          <h3 className="mt-1 font-display text-2xl font-bold leading-tight">{player.name}</h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{player.team}</span>
            <span className="text-border">·</span>
            <span>{details?.archetype || "Aggressor"}</span>
          </div>
        </div>
        <ScoreRing value={score} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 font-display text-[11px] font-semibold tracking-wide text-primary">
          <RoleIcon className="h-3.5 w-3.5" />
          {player.role || "Player"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <Stat label="Runs" value={details?.profile?.totalRuns || 0} />
        <Stat label="SR" value={details?.profile?.overallSR || 0} decimals={1} />
        <Stat label="Avg" value={details?.profile?.overallAvg || 0} decimals={1} />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-background/40 p-3 text-center">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">Fair value estimate</span>
        <span className="font-display text-2xl font-bold tabular-nums">₹{((score / 10) * 1.2).toFixed(1)} Cr</span>
      </div>
    </div>
  )
}

function Stat({ label, value, decimals = 0, suffix }: { label: string, value: number, decimals?: number, suffix?: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-semibold tabular-nums">
        <CountUp value={value} decimals={decimals} suffix={suffix} />
      </div>
    </div>
  )
}

function OverviewTab({ player, details }: { player: any, details: any }) {
  const radar = [
    { metric: "Power", value: details?.profile?.intentScore ? Math.min(100, details.profile.intentScore / 1.5) : 70 },
    { metric: "Consistency", value: details?.profile?.consistency ? details.profile.consistency * 100 : 75 },
    { metric: "Vs Spin", value: details?.profile?.srVsSpin ? Math.min(100, details.profile.srVsSpin / 1.6) : 80 },
    { metric: "Vs Pace", value: details?.profile?.srVsPace ? Math.min(100, details.profile.srVsPace / 1.6) : 80 },
    { metric: "Overall", value: details?.scoutingScore || 75 },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="glass-card flex flex-col justify-between rounded-2xl p-5">
        <div className="font-display text-sm font-semibold">Season Aggregates</div>
        <div className="mt-4 grid grid-cols-2 gap-y-4">
          <Stat label="Boundary%" value={details?.profile?.boundaryPct || 0} decimals={1} suffix="%" />
          <Stat label="Dot%" value={details?.profile?.dotPct || 0} decimals={1} suffix="%" />
          <Stat label="Innings" value={details?.profile?.totalInnings || 0} />
          <Stat label="Intent" value={details?.profile?.intentScore || 0} decimals={1} />
        </div>
      </div>
      <div className="glass-card rounded-2xl p-5">
        <div className="font-display text-sm font-semibold">Skill Analysis</div>
        <ul className="mt-3 space-y-2.5">
          {radar.map((r) => (
            <li key={r.metric} className="flex items-center gap-3">
              <span className="w-24 text-xs text-muted-foreground">{r.metric}</span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-background ring-1 ring-border">
                <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${r.value}%` }} />
              </div>
              <span className="w-9 text-right font-mono text-xs tabular-nums"><CountUp value={r.value} /></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function PhaseTab({ details }: { details: any }) {
  const data = details?.phases ? [
    { phase: "Powerplay", value: details.phases.powerplay?.sr || 0 },
    { phase: "Middle", value: details.phases.middle?.sr || 0 },
    { phase: "Death", value: details.phases.death?.sr || 0 },
  ] : []
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="font-display text-sm font-semibold">Phase SR Splits</div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#1f2937" vertical={false} />
            <XAxis dataKey="phase" tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#0f1525", border: "1px solid #1f2937" }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#00d4aa" />
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
        <div className="text-3xl mb-3">🏟️</div>
        <div className="text-muted-foreground text-sm">No venue records found for {details?.player || "this player"}</div>
      </div>
    )
  }
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="font-display text-sm font-semibold mb-4">Venue Performance</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {venues.map((v: any, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-background/40 p-3">
            <div className="font-medium text-sm truncate">{v.venue || v.name}</div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div><div className="text-[10px] text-muted-foreground">Runs</div><div className="font-display text-sm font-bold">{v.runs || 0}</div></div>
              <div><div className="text-[10px] text-muted-foreground">SR</div><div className="font-display text-sm font-bold">{v.sr?.toFixed(1) || '0'}</div></div>
              <div><div className="text-[10px] text-muted-foreground">Inns</div><div className="font-display text-sm font-bold">{v.innings || v.matches || 0}</div></div>
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
      <div className="glass-card rounded-2xl p-5 text-center py-16 text-muted-foreground text-sm">
        <div className="text-3xl mb-3">⚔️</div>
        Select a player to see bowling-type matchup data
      </div>
    )
  }
  const matchupData = [
    { type: "vs Spin", sr: profile.srVsSpin || 0, color: "#a855f7" },
    { type: "vs Pace", sr: profile.srVsPace || 0, color: "#3b82f6" },
  ]
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="font-display text-sm font-semibold mb-4">Bowling Type Matchups</div>
      <div className="grid gap-4 sm:grid-cols-2">
        {matchupData.map((m) => (
          <div key={m.type} className="rounded-xl border border-border bg-background/40 p-4" style={{ borderLeftColor: m.color, borderLeftWidth: 3 }}>
            <div className="text-xs text-muted-foreground">{m.type}</div>
            <div className="font-display text-2xl font-bold mt-1" style={{ color: m.color }}>{m.sr.toFixed(1)}</div>
            <div className="text-[10px] text-muted-foreground">Strike Rate</div>
          </div>
        ))}
      </div>
      {(profile.boundaryPct || profile.dotPct) && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
            <div className="text-[10px] text-muted-foreground">Boundary %</div>
            <div className="font-display text-lg font-bold text-primary">{profile.boundaryPct?.toFixed(1) || 0}%</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
            <div className="text-[10px] text-muted-foreground">Dot Ball %</div>
            <div className="font-display text-lg font-bold text-secondary">{profile.dotPct?.toFixed(1) || 0}%</div>
          </div>
        </div>
      )}
    </div>
  )
}

function TrendTab({ details }: { details: any }) {
  const trend = details?.seasonTrend
  const score = details?.scoutingScore || 0
  const archetype = details?.archetype || 'Unknown'
  const trendIcon = trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️'
  const trendColor = trend === 'improving' ? '#00d4aa' : trend === 'declining' ? '#ef4444' : '#f59e0b'

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="font-display text-sm font-semibold">Performance Overview</div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background/40 p-4 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Scouting Score</div>
          <div className="font-display text-3xl font-bold mt-2" style={{ color: score >= 75 ? '#00d4aa' : score >= 60 ? '#f59e0b' : '#9ca3af' }}>{score.toFixed(0)}</div>
          <div className="text-[10px] text-muted-foreground mt-1">out of 100</div>
        </div>
        <div className="rounded-xl border border-border bg-background/40 p-4 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Form Trend</div>
          <div className="text-3xl mt-2">{trendIcon}</div>
          <div className="text-xs font-semibold mt-1 capitalize" style={{ color: trendColor }}>{trend || 'stable'}</div>
        </div>
        <div className="rounded-xl border border-border bg-background/40 p-4 text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Archetype</div>
          <div className="font-display text-base font-bold mt-3 text-primary">{archetype}</div>
          <div className="text-[10px] text-muted-foreground mt-1">T20 classification</div>
        </div>
      </div>
      {details?.profile && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
            <div className="text-[10px] text-muted-foreground">Total Runs</div>
            <div className="font-display text-lg font-bold">{details.profile.totalRuns?.toLocaleString() || 0}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
            <div className="text-[10px] text-muted-foreground">Innings</div>
            <div className="font-display text-lg font-bold">{details.profile.totalInnings || 0}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
            <div className="text-[10px] text-muted-foreground">Intent Score</div>
            <div className="font-display text-lg font-bold">{details.profile.intentScore?.toFixed(1) || 0}</div>
          </div>
          <div className="rounded-xl border border-border bg-background/40 p-3 text-center">
            <div className="text-[10px] text-muted-foreground">Consistency</div>
            <div className="font-display text-lg font-bold">{((details.profile.consistency || 0) * 100).toFixed(0)}%</div>
          </div>
        </div>
      )}
    </div>
  )
}
