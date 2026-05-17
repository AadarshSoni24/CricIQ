"use client"

import { useEffect, useState } from "react"
import { API_BASE } from "@/lib/cric-data"
import { cn } from "@/lib/utils"
import { CountUp } from "./count-up"
import { StadiumIcon, PitchLines, CricketBall } from "./cricket-icons"
import { Droplets, Sun, Wind, MapPin, Search } from "lucide-react"

type VenueData = {
  name: string
  city?: string
  pitch_dna?: string
  avg_1st_innings?: number
  bat_first_win_pct?: number
  matches_played?: number
}

export function VenueIntel() {
  const [venues, setVenues] = useState<string[]>([])
  const [selected, setSelected] = useState<string>("")
  const [venueInfo, setVenueInfo] = useState<VenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [infoLoading, setInfoLoading] = useState(false)
  const [search, setSearch] = useState("")

  // Fetch all venues from backend
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await fetch(`${API_BASE}/venues`)
        const data = await res.json()
        // API returns string[] of venue names
        const venueList = Array.isArray(data) ? data.map((v: any) => typeof v === 'string' ? v : v.name) : []
        setVenues(venueList)
        if (venueList.length > 0) {
          setSelected(venueList[0])
        }
      } catch (err) {
        console.error("Failed to fetch venues", err)
      } finally {
        setLoading(false)
      }
    }
    fetchVenues()
  }, [])

  // Fetch venue stats when selected changes — use a lightweight predict call with dummy teams
  useEffect(() => {
    if (!selected) return
    const fetchVenueStats = async () => {
      setInfoLoading(true)
      try {
        // Try to get venue info via prediction endpoint (it returns venueInfo)
        const res = await fetch(`${API_BASE}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team1: "Mumbai Indians",
            team2: "Chennai Super Kings",
            venue: selected,
            tossWinner: "Mumbai Indians",
            tossDecision: "bat",
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setVenueInfo({
            name: selected,
            city: extractCity(selected),
            pitch_dna: data.venueInfo?.pitch_dna || "balanced",
            avg_1st_innings: data.venueInfo?.avg_1st_innings,
            bat_first_win_pct: data.venueInfo?.bat_first_win_pct,
            matches_played: data.venueInfo?.matches_played,
          })
        } else {
          setVenueInfo({ name: selected, city: extractCity(selected) })
        }
      } catch (err) {
        console.error(err)
        setVenueInfo({ name: selected, city: extractCity(selected) })
      } finally {
        setInfoLoading(false)
      }
    }
    fetchVenueStats()
  }, [selected])

  const filtered = search
    ? venues.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
    : venues

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const pitchLabel = venueInfo?.pitch_dna === "batting_friendly"
    ? "🏏 Batting Friendly"
    : venueInfo?.pitch_dna === "bowling_friendly"
    ? "🎳 Bowling Friendly"
    : "⚖️ Balanced"

  const batFirstPct = venueInfo?.bat_first_win_pct
    ? (venueInfo.bat_first_win_pct * 100).toFixed(0)
    : null
  const chasePct = batFirstPct ? (100 - Number(batFirstPct)).toFixed(0) : null

  return (
    <section className="space-y-6">
      <PageHeading
        eyebrow="Venue Intel"
        title="Read the ground before the toss"
        subtitle="Pitch personality, scoring patterns and batting-first vs chasing success — powered by real match data."
      />

      {/* Search */}
      <div className="glass-card flex items-center gap-3 rounded-2xl p-2 pl-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search venues..."
          className="flex-1 bg-transparent py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
        />
        <span className="rounded-full border border-border bg-background/40 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {venues.length} venues
        </span>
      </div>

      {/* Venue selector grid */}
      <div className="grid max-h-64 gap-2 overflow-y-auto pr-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <button
            key={v}
            onClick={() => setSelected(v)}
            className={cn(
              "glass-card group flex items-start gap-3 rounded-2xl p-4 text-left transition hover:translate-y-[-1px]",
              selected === v && "ring-1 ring-primary/40",
            )}
          >
            <div
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1",
                selected === v
                  ? "bg-primary/10 text-primary ring-primary/30"
                  : "bg-background/40 text-muted-foreground ring-border",
              )}
            >
              <StadiumIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-semibold">{v}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {extractCity(v)}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No venues match your search
          </div>
        )}
      </div>

      {/* Stats dashboard */}
      {venueInfo && (
        <div className={cn("space-y-4 transition-opacity", infoLoading && "opacity-50")}>
          {/* Big stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BigStat
              label="Average 1st Innings"
              value={venueInfo.avg_1st_innings || 0}
              suffix=""
              tone="primary"
              icon={<PitchLines className="h-5 w-5" />}
              hint="runs scored batting first"
            />
            <BigStat
              label="Bat first win %"
              value={batFirstPct ? Number(batFirstPct) : 0}
              suffix="%"
              tone="secondary"
              icon={<CricketBall className="h-5 w-5" />}
              hint="historical win rate"
            />
            <BigStat
              label="Chase win %"
              value={chasePct ? Number(chasePct) : 0}
              suffix="%"
              tone="primary"
              icon={<Sun className="h-5 w-5" />}
              hint="chasing team wins"
            />
            <BigStat
              label="Matches played"
              value={venueInfo.matches_played || 0}
              suffix=""
              tone="secondary"
              icon={<Wind className="h-5 w-5" />}
              hint="total IPL matches"
            />
          </div>

          {/* Conditions panel */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="glass-card rounded-2xl p-5">
              <div className="font-display text-sm font-semibold">Venue Profile</div>
              <div className="mt-4 space-y-3">
                <ConditionRow
                  icon={<PitchLines className="h-4 w-4" />}
                  label="Pitch type"
                  value={pitchLabel}
                  tone="primary"
                />
                <ConditionRow
                  icon={<Droplets className="h-4 w-4" />}
                  label="Avg 1st Innings"
                  value={venueInfo.avg_1st_innings ? `${venueInfo.avg_1st_innings.toFixed(0)} runs` : "N/A"}
                  tone="secondary"
                />
                <ConditionRow
                  icon={<CricketBall className="h-4 w-4" />}
                  label="Matches"
                  value={venueInfo.matches_played?.toString() || "N/A"}
                  tone="primary"
                />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <div className="font-display text-sm font-semibold">Coach's Analysis</div>
              <div className="mt-4 rounded-xl border border-border bg-background/40 p-4">
                <p className="text-sm leading-relaxed text-foreground">
                  <span className="font-display font-semibold text-primary">{venueInfo.name}</span>
                  {" "}is classified as a{" "}
                  <span className="text-secondary">{pitchLabel.replace(/[🏏🎳⚖️ ]/g, "").toLowerCase()}</span>
                  {" "}surface.
                  {batFirstPct && Number(batFirstPct) > 50 && (
                    <> Teams batting first have won <span className="font-bold text-primary">{batFirstPct}%</span> of matches here, suggesting setting a target is the safer strategy.</>
                  )}
                  {batFirstPct && Number(batFirstPct) <= 50 && (
                    <> Chasing has historically returned <span className="font-bold text-primary">{chasePct}%</span> wins, making it favourable to bowl first at this venue.</>
                  )}
                  {venueInfo.avg_1st_innings && (
                    <> The average first-innings score is <span className="font-bold">{venueInfo.avg_1st_innings.toFixed(0)}</span> runs across <span className="font-bold">{venueInfo.matches_played || "multiple"}</span> IPL matches.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// Extract city from venue name (best effort)
function extractCity(venue: string): string {
  const cityMap: Record<string, string> = {
    "Wankhede": "Mumbai", "Brabourne": "Mumbai", "DY Patil": "Mumbai",
    "Chepauk": "Chennai", "Chidambaram": "Chennai",
    "Eden Gardens": "Kolkata", "Chinnaswamy": "Bengaluru",
    "Rajiv Gandhi": "Hyderabad", "Uppal": "Hyderabad",
    "Arun Jaitley": "Delhi", "Feroz Shah": "Delhi",
    "Mohali": "Chandigarh", "Punjab": "Mohali",
    "Sawai Mansingh": "Jaipur", "Jaipur": "Jaipur",
    "Narendra Modi": "Ahmedabad", "Motera": "Ahmedabad",
    "Ekana": "Lucknow", "Lucknow": "Lucknow",
    "Dharamsala": "Dharamsala", "HPCA": "Dharamsala",
    "Guwahati": "Guwahati", "Barsapara": "Guwahati",
  }
  for (const [key, city] of Object.entries(cityMap)) {
    if (venue.includes(key)) return city
  }
  // Fallback: take last part after comma if available
  if (venue.includes(",")) return venue.split(",").pop()?.trim() || "India"
  return "India"
}

function BigStat({
  label,
  value,
  suffix,
  tone,
  icon,
  hint,
}: {
  label: string
  value: number
  suffix?: string
  tone: "primary" | "secondary"
  icon: React.ReactNode
  hint?: string
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg ring-1",
            tone === "primary"
              ? "bg-primary/10 text-primary ring-primary/20"
              : "bg-secondary/10 text-secondary ring-secondary/30",
          )}
        >
          {icon}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-4 font-display text-3xl font-bold tabular-nums">
        <CountUp value={value} suffix={suffix} />
      </div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  )
}

function ConditionRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: "primary" | "secondary"
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={cn(tone === "primary" ? "text-primary" : "text-secondary")}>
          {icon}
        </span>
        {label}
      </span>
      <span className="font-display text-sm font-semibold">{value}</span>
    </div>
  )
}

function PageHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
        {eyebrow}
      </span>
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}
