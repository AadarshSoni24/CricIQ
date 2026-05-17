"use client" // MERN Integrated

import { useEffect, useMemo, useState } from "react"
import { type Team, type Player, API_BASE } from "@/lib/cric-data"
import { TeamLogo } from "./team-logo"
import {
  CricketBall,
  Target,
  Zap,
  Swords,
  ChevronDown,
} from "lucide-react"
import { CricketBat } from "./cricket-icons"
import { cn } from "@/lib/utils"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts"

export function MatchupExplorer() {
  const [players, setPlayers] = useState<any[]>([])
  const [batter, setBatter] = useState<any>(null)
  const [bowler, setBowler] = useState<any>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch(`${API_BASE}/players/list`)
        const data = await res.json()
        
        const list = [
          ...(data.batters || []).map((name: string) => ({ name, role: "Batter", team: "IPL" })),
          ...(data.bowlers || []).map((name: string) => ({ name, role: "Bowler", team: "IPL" }))
        ]
        
        setPlayers(list)
        setBatter(list.find((p: any) => p.role === "Batter") || list[0])
        setBowler(list.find((p: any) => p.role === "Bowler") || list[1])
      } catch (err) {
        console.error(err)
      } finally {
        setInitLoading(false)
      }
    }
    fetchList()
  }, [])

  useEffect(() => {
    const fetchMatchup = async () => {
      if (!batter || !bowler) return
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/matchup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batter: batter.name, bowler: bowler.name }),
        })
        const result = await res.json()
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchMatchup()
  }, [batter, bowler])

  if (initLoading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Matchup Explorer"
        title="Battle of the specialists"
        subtitle="Analyze head-to-head records across different match phases. Predict vulnerabilities before the first ball."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <PlayerPicker label="Select Batter" selected={batter} players={players} onSelect={setBatter} role="Batter" />
        <div className="relative grid place-items-center"><div className="h-12 w-12 rounded-full bg-card grid place-items-center border border-border shadow-lg"><Swords className="h-5 w-5 text-secondary" /></div></div>
        <PlayerPicker label="Select Bowler" selected={bowler} players={players} onSelect={setBowler} role="Bowler" />
      </div>

      <div className={cn("space-y-6 transition-opacity", loading && "opacity-50")}>
        {data && <MatchupResults data={data} batter={batter} bowler={bowler} />}
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

function PlayerPicker({ label, selected, players, onSelect, role }: { label: string, selected: any, players: any[], onSelect: (p: any) => void, role: string }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  
  const filtered = players
    .filter(p => p.role === role || p.role === "All-rounder" || p.role === "Player")
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className={cn("glass-card p-4 rounded-2xl relative", open && "z-50")}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <button onClick={() => setOpen(!open)} className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-3 py-2.5 transition hover:ring-1 hover:ring-primary/30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 grid place-items-center font-display text-xs font-bold">{selected?.name[0] || "?"}</div>
          <div className="text-left">
            <div className="text-sm font-bold">{selected?.name || "Select Player"}</div>
            <div className="text-[10px] text-muted-foreground">{selected?.team || "IPL"}</div>
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 top-[100%] mt-2 flex flex-col rounded-xl border border-border bg-popover p-2 shadow-2xl">
          <input
            autoFocus
            type="text"
            placeholder={`Search ${role}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2 w-full rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <div className="grid max-h-48 grid-cols-1 gap-1 overflow-auto">
            {filtered.map(p => (
              <button key={p.name} onClick={() => { onSelect(p); setOpen(false); setSearch("") }} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-card">
                <span className="font-medium">{p.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="p-2 text-center text-xs text-muted-foreground">No players found</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function MatchupResults({ data, batter, bowler }: { data: any, batter: any, bowler: any }) {
  return (
    <div className="grid gap-4">
      <div className="glass-card p-5 rounded-2xl">
        <div className="font-display text-sm font-semibold">Head-to-Head Stats</div>
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Runs" value={data.summary?.runs || 0} />
          <Stat label="Balls" value={data.summary?.balls || 0} />
          <Stat label="Dismissals" value={data.summary?.dismissals || 0} />
          <Stat label="Strike Rate" value={data.summary?.strike_rate || 0} decimals={1} />
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, decimals = 0 }: { label: string, value: number, decimals?: number }) {
  return (
    <div className="bg-background/40 p-3 rounded-xl border border-border/60">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-xl font-bold tabular-nums mt-1">{value.toFixed(decimals)}</div>
    </div>
  )
}
