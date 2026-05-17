"use client" // MERN Integrated

import { useEffect, useMemo, useState } from "react"
import { type Player, type PlayerRole, API_BASE } from "@/lib/cric-data"
import { CountUp } from "./count-up"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Brain,
  Check,
  Filter,
  Plus,
} from "lucide-react"
import { CricketBat, CricketBall, CricketHelmet } from "./cricket-icons"

const ROLES: PlayerRole[] = ["Batter", "Bowler", "All-rounder", "Wicket-keeper"]

const REQUIRED: Record<PlayerRole, number> = {
  Batter: 5,
  Bowler: 5,
  "All-rounder": 3,
  "Wicket-keeper": 2,
}

const BUDGET_TOTAL = 100 // ₹ Cr

export function AuctionIntelligence() {
  const [players, setPlayers] = useState<any[]>([])
  const [roleFilter, setRoleFilter] = useState<PlayerRole | "All">("All")
  const [targets, setTargets] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch(`${API_BASE}/players/list`)
        const data = await res.json()
        
        const batters = (data.batters || []).map((name: string) => ({ name, role: "Batter", team: "IPL", score: 0, fairValue: 0 }))
        const bowlers = (data.bowlers || []).map((name: string) => ({ name, role: "Bowler", team: "IPL", score: 0, fairValue: 0 }))
        const list = [...batters, ...bowlers]
        
        // Fetch scouting scores for the first batch of players
        const enriched = await Promise.all(
          list.slice(0, 40).map(async (p: any) => {
            try {
              const pRes = await fetch(`${API_BASE}/players/${encodeURIComponent(p.name)}`)
              if (pRes.ok) {
                const pData = await pRes.json()
                return {
                  ...p,
                  score: pData.scoutingScore || 0,
                  archetype: pData.archetype || "Unknown",
                  fairValue: pData.scoutingScore ? (pData.scoutingScore / 10) * 1.2 : 0,
                  tier: pData.scoutingScore >= 80 ? "Premium" : pData.scoutingScore >= 65 ? "High Value" : pData.scoutingScore >= 50 ? "Mid Tier" : "Budget",
                }
              }
              return p
            } catch { return p }
          })
        )
        
        // Add remaining un-enriched players
        setPlayers([...enriched, ...list.slice(40)])
      } catch (err) {
        console.error("Failed to fetch players for auction", err)
      } finally {
        setLoading(false)
      }
    }
    fetchPlayers()
  }, [])

  const filtered = useMemo(() => {
    if (!Array.isArray(players)) return []
    return players.filter((p) => {
      if (roleFilter !== "All" && p.role !== roleFilter) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [roleFilter, players, search])

  const targetedPlayers = players.filter((p) => targets.includes(p.name))
  const spent = targetedPlayers.reduce((s, p) => s + (p.fairValue || 0), 0)
  const budgetLeft = BUDGET_TOTAL - spent
  const budgetPct = Math.min(100, (spent / BUDGET_TOTAL) * 100)

  const roleCounts = ROLES.reduce<Record<PlayerRole, number>>(
    (acc, r) => ({ ...acc, [r]: targetedPlayers.filter((p) => p.role === r).length }),
    { Batter: 0, Bowler: 0, "All-rounder": 0, "Wicket-keeper": 0 },
  )

  const toggleTarget = (name: string) => {
    setTargets((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]))
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Auction Intelligence"
        title="Build a squad that survives the auction"
        subtitle="Filter, value and shortlist talent — track squad voids and budget like a head of strategy."
      />

      <div className="glass-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary/10 text-secondary ring-1 ring-secondary/30">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="font-display text-sm font-semibold">Squad voids</div>
            <div className="text-xs text-muted-foreground">Roles still required to complete a 15-man squad</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => {
            const need = REQUIRED[r]
            const have = roleCounts[r]
            const missing = Math.max(0, need - have)
            const ok = missing === 0
            return (
              <div
                key={r}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
                  ok
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-secondary/40 bg-secondary/5 text-secondary",
                )}
              >
                <RoleIcon role={r} className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{r}</span>
                <span className="font-mono tabular-nums">
                  {have}/{need}
                </span>
                {!ok && <span>· need {missing}</span>}
                {ok && <Check className="h-3 w-3" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr_320px]">
        <aside className="glass-card h-fit rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-semibold">Filters</span>
          </div>

          <FilterGroup label="Role">
            <div className="grid grid-cols-2 gap-1.5">
              {(["All", ...ROLES] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-[11px] transition",
                    roleFilter === r
                      ? "bg-primary/10 text-foreground ring-1 ring-primary/30"
                      : "bg-background/40 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup label="Search">
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </FilterGroup>
        </aside>

        <div className="grid max-h-[800px] gap-4 overflow-y-auto pr-2 sm:grid-cols-2">
          {filtered.map((p) => (
            <PlayerAuctionCard
              key={`${p.name}-${p.role}`}
              player={p}
              targeted={targets.includes(p.name)}
              onToggle={() => toggleTarget(p.name)}
            />
          ))}
        </div>

        <aside className="space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold">Budget usage</span>
              <span className="font-mono text-xs text-muted-foreground">₹{spent.toFixed(1)}/₹{BUDGET_TOTAL} Cr</span>
            </div>
            <div className="relative mt-4 h-4 overflow-hidden rounded-full bg-background ring-1 ring-border">
              <div
                className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Remaining</span>
              <span className="font-display text-lg font-bold text-foreground">₹{budgetLeft.toFixed(1)} Cr</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  )
}

function RoleIcon({ role, className }: { role: PlayerRole; className?: string }) {
  if (role === "Bowler") return <CricketBall className={className} />
  if (role === "All-rounder") return <CricketHelmet className={className} />
  return <CricketBat className={className} />
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

function PlayerAuctionCard({ player, targeted, onToggle }: { player: any, targeted: boolean, onToggle: () => void }) {
  const [bidData, setBidData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchAiValue = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auction/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player: player.name, role: player.role?.toLowerCase().includes("batter") ? "batter" : "bowler", basePriceLakh: 200 }),
      })
      const data = await res.json()
      setBidData(data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const score = player.score || 0
  const tone = score >= 85 ? "#00d4aa" : score >= 70 ? "#f59e0b" : "#9ca3af"
  const tierColors: Record<string, string> = { Premium: "#00d4aa", "High Value": "#f59e0b", "Mid Tier": "#3b82f6", Budget: "#9ca3af" }

  return (
    <div className={cn("glass-card group flex flex-col gap-3 rounded-2xl p-4 transition", targeted && "ring-1 ring-primary/40")}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <RoleIcon role={player.role || "Batter"} className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{player.role}</span>
            {player.tier && (
              <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ background: `${tierColors[player.tier] || '#9ca3af'}22`, color: tierColors[player.tier] || '#9ca3af' }}>{player.tier}</span>
            )}
          </div>
          <div className="mt-1 truncate font-display text-base font-bold leading-tight">{player.name}</div>
          <div className="text-[11px] text-muted-foreground">{player.archetype || player.team}</div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-background/40">
          <span className="font-display text-lg font-bold tabular-nums" style={{ color: tone }}>{score > 0 ? score.toFixed(0) : '—'}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button onClick={fetchAiValue} disabled={loading} className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-display text-[10px] font-semibold tracking-wide text-primary hover:bg-primary/20 transition">
          {loading ? <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Brain className="h-2.5 w-2.5" />}
          {bidData ? `₹${(bidData.bidRange?.recommendedLakh / 100)?.toFixed(1) || bidData.predicted_price_cr?.toFixed(1)}Cr` : "Get AI Value"}
        </button>
        {bidData?.bidRange && (
          <>
            <span className="rounded-full border border-border bg-background/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">Min ₹{(bidData.bidRange.minLakh / 100).toFixed(1)}Cr</span>
            <span className="rounded-full border border-border bg-background/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">Max ₹{(bidData.bidRange.maxLakh / 100).toFixed(1)}Cr</span>
          </>
        )}
        {!bidData && player.fairValue > 0 && (
          <span className="rounded-full border border-border bg-background/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">Fair ₹{player.fairValue.toFixed(1)}Cr</span>
        )}
      </div>

      <button onClick={onToggle} className={cn("mt-auto flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition", targeted ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-background/60 text-foreground ring-1 ring-border hover:ring-primary/30")}>
        {targeted ? <><Check className="h-3.5 w-3.5" /> On target list</> : <><Plus className="h-3.5 w-3.5" /> Add to target list</>}
      </button>
    </div>
  )
}
