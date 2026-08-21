"use client"

import { useEffect, useMemo, useState } from "react"
import { type PlayerRole, API_BASE } from "@/lib/cric-data"
import { CountUp } from "./count-up"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  Brain,
  Check,
  CheckCircle2,
  DollarSign,
  Filter,
  Gavel,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  X,
  Zap,
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
  const [tierFilter, setTierFilter] = useState<string>("All")
  const [targets, setTargets] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch(`${API_BASE}/players/list`)
        const data = await res.json()

        const batters = (data.batters || []).map((name: string) => ({
          name,
          role: "Batter",
          team: "IPL",
          score: 72,
          fairValue: 8.5,
          tier: "High Value",
        }))
        const bowlers = (data.bowlers || []).map((name: string) => ({
          name,
          role: "Bowler",
          team: "IPL",
          score: 70,
          fairValue: 7.8,
          tier: "High Value",
        }))
        const list = [...batters, ...bowlers]

        // Enrich first batch of players
        const enriched = await Promise.all(
          list.slice(0, 35).map(async (p: any) => {
            try {
              const pRes = await fetch(`${API_BASE}/players/${encodeURIComponent(p.name)}`)
              if (pRes.ok) {
                const pData = await pRes.json()
                const sc = pData.scoutingScore || 70
                return {
                  ...p,
                  score: sc,
                  archetype: pData.archetype || "Specialist",
                  fairValue: Number(((sc / 10) * 1.3).toFixed(1)),
                  tier: sc >= 82 ? "Elite (₹10Cr+)" : sc >= 68 ? "High Value (₹5-10Cr)" : sc >= 52 ? "Mid Tier (₹2-5Cr)" : "Budget (<₹2Cr)",
                }
              }
              return p
            } catch {
              return p
            }
          })
        )

        setPlayers([...enriched, ...list.slice(35)])
        // Set some default targets for realistic demo state
        if (enriched.length >= 3) {
          setTargets([enriched[0].name, enriched[1].name])
        }
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
      if (tierFilter !== "All" && !p.tier?.includes(tierFilter)) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [roleFilter, tierFilter, players, search])

  const targetedPlayers = players.filter((p) => targets.includes(p.name))
  const spent = targetedPlayers.reduce((s, p) => s + (p.fairValue || 0), 0)
  const budgetLeft = Math.max(0, BUDGET_TOTAL - spent)
  const budgetPct = Math.min(100, (spent / BUDGET_TOTAL) * 100)

  const roleCounts = ROLES.reduce<Record<PlayerRole, number>>(
    (acc, r) => ({ ...acc, [r]: targetedPlayers.filter((p) => p.role === r).length }),
    { Batter: 0, Bowler: 0, "All-rounder": 0, "Wicket-keeper": 0 },
  )

  const toggleTarget = (name: string) => {
    setTargets((prev) => (prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]))
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <span className="font-mono text-xs text-muted-foreground">Initializing Auction Simulation Cockpit…</span>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Auction Intelligence"
        title="Tactical Squad Builder & Purse Optimizer"
        subtitle="Simulate real-time IPL auction bidding wars. Track salary caps, role quotas, and AI-predicted valuation ceilings."
      />

      {/* Salary Cap Cockpit Header */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary/15 text-secondary ring-1 ring-secondary/30 shadow-sm">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Total Salary Purse (Cap: ₹100.0 Cr)
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className={cn(
                    "font-display text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight",
                    budgetLeft > 30 ? "text-primary" : budgetLeft > 10 ? "text-secondary" : "text-destructive",
                  )}
                >
                  ₹{budgetLeft.toFixed(1)} <span className="text-lg text-muted-foreground font-semibold">Cr Left</span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  (₹{spent.toFixed(1)} Cr committed)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-border/80 bg-background/50 px-4 py-2 text-center">
              <div className="text-[9.5px] font-bold uppercase text-muted-foreground">Target Squad</div>
              <div className="font-display text-lg font-bold text-foreground mt-0.5">
                {targetedPlayers.length} <span className="text-xs text-muted-foreground">/ 15</span>
              </div>
            </div>
            <div className="rounded-xl border border-border/80 bg-background/50 px-4 py-2 text-center">
              <div className="text-[9.5px] font-bold uppercase text-muted-foreground">Avg Price / Slot</div>
              <div className="font-display text-lg font-bold text-secondary mt-0.5">
                ₹{targetedPlayers.length > 0 ? (spent / targetedPlayers.length).toFixed(1) : "0.0"} Cr
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
            <span>Purse Utilized: {budgetPct.toFixed(1)}%</span>
            <span>Safety Margin: {Math.max(0, 100 - budgetPct).toFixed(1)}%</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-background/90 ring-1 ring-border shadow-inner">
            <div
              className="animate-fill-bar absolute inset-y-0 left-0 rounded-full transition-all"
              style={{
                width: `${budgetPct}%`,
                background:
                  budgetPct < 65
                    ? "linear-gradient(90deg, #00e599, #10b981)"
                    : budgetPct < 85
                      ? "linear-gradient(90deg, #38bdf8, #ffb800)"
                      : "linear-gradient(90deg, #ffb800, #ef4444)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Role Quota Checklist */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((role) => {
          const count = roleCounts[role] || 0
          const min = REQUIRED[role]
          const isComplete = count >= min
          const RoleIcon = role === "Bowler" ? CricketBall : role === "All-rounder" ? CricketHelmet : CricketBat

          return (
            <div
              key={role}
              className={cn(
                "glass-card rounded-2xl p-4 transition-all flex items-center justify-between",
                isComplete ? "border-primary/40 bg-primary/5" : "border-border/80",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl ring-1",
                    isComplete ? "bg-primary/15 text-primary ring-primary/30" : "bg-card text-muted-foreground ring-border",
                  )}
                >
                  <RoleIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-display text-xs font-bold text-foreground">{role}s</div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {count} / {min} Target
                  </div>
                </div>
              </div>

              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
                  isComplete
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-secondary/15 text-secondary border border-secondary/30",
                )}
              >
                {isComplete ? "Target Met" : `Need ${min - count}`}
              </span>
            </div>
          )
        })}
      </div>

      {/* Target Squad Roster */}
      {targetedPlayers.length > 0 && (
        <div className="glass-card rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-display text-sm font-bold text-foreground">Target Squad Drafted</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {targetedPlayers.length} Players · ₹{spent.toFixed(1)} Cr
            </span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {targetedPlayers.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded-xl border border-border/80 bg-background/60 p-3 transition hover:border-primary/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 font-display text-[10px] font-bold text-foreground">
                    {p.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-foreground truncate">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      <span>{p.role}</span>
                      <span>·</span>
                      <span className="text-primary font-bold">IQ {p.score}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs font-bold text-secondary">₹{p.fairValue?.toFixed(1)} Cr</span>
                  <button
                    onClick={() => toggleTarget(p.name)}
                    className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition cursor-pointer"
                    title="Remove from squad"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auction Market Browser */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-display text-sm font-bold text-foreground block">Auction Player Pool</span>
            <span className="text-xs text-muted-foreground">Select players to add to your target franchise roster</span>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search player pool…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/60 py-2 pl-9 pr-3 text-xs placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Role & Tier Filters */}
        <div className="flex flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(["All", ...ROLES] as (PlayerRole | "All")[]).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer shrink-0",
                  roleFilter === r
                    ? "bg-primary text-primary-foreground font-bold"
                    : "bg-background/50 text-muted-foreground hover:text-foreground border border-border/80",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Player Pool Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map((p) => {
            const isDrafted = targets.includes(p.name)
            return (
              <div
                key={p.name}
                className={cn(
                  "rounded-2xl border p-4 transition-all flex flex-col justify-between space-y-3",
                  isDrafted
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                    : "border-border/70 bg-background/50 hover:border-primary/40 hover:bg-background/80",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-display font-bold text-sm text-foreground truncate block">{p.name}</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                      <span>{p.role}</span>
                      <span>·</span>
                      <span className="text-foreground">{p.archetype || "Specialist"}</span>
                    </div>
                  </div>
                  <span className="rounded-md border border-primary/30 bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold text-primary shrink-0">
                    IQ {p.score || 72}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <div>
                    <span className="text-[9.5px] font-bold uppercase text-muted-foreground block">Fair Valuation</span>
                    <span className="font-display text-base font-extrabold text-secondary">
                      ₹{p.fairValue?.toFixed(1) || 7.5} Cr
                    </span>
                  </div>

                  <button
                    onClick={() => toggleTarget(p.name)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                      isDrafted
                        ? "bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25"
                        : "bg-primary text-primary-foreground hover:brightness-110 shadow-sm",
                    )}
                  >
                    {isDrafted ? (
                      <>
                        <X className="h-3.5 w-3.5" />
                        <span>Remove</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Draft</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
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
