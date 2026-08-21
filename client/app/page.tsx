"use client"

import { useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { NavTabs, type TabKey } from "@/components/nav-tabs"
import { MatchPredictor } from "@/components/match-predictor"
import { PlayerScout } from "@/components/player-scout"
import { AuctionIntelligence } from "@/components/auction-intelligence"
import { MatchupExplorer } from "@/components/matchup-explorer"
import { VenueIntel } from "@/components/venue-intel"
import { Activity, Cpu, ShieldCheck, Sparkles } from "lucide-react"

export default function Page() {
  const [tab, setTab] = useState<TabKey>("predictor")

  return (
    <div className="relative min-h-dvh bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Stadium Ambient Background Lighting */}
      <div className="pitch-pattern pointer-events-none fixed inset-0 -z-10 opacity-70" aria-hidden />
      <div
        className="pointer-events-none fixed -left-48 -top-48 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -right-48 top-1/3 -z-10 h-96 w-96 rounded-full bg-secondary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed left-1/3 -bottom-48 -z-10 h-96 w-96 rounded-full bg-chart-3/10 blur-3xl"
        aria-hidden
      />

      <SiteHeader />
      <NavTabs active={tab} onChange={setTab} />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="transition-all duration-300">
          {tab === "predictor" && <MatchPredictor />}
          {tab === "scout" && <PlayerScout />}
          {tab === "auction" && <AuctionIntelligence />}
          {tab === "matchup" && <MatchupExplorer />}
          {tab === "venue" && <VenueIntel />}
        </div>

        {/* Global Polished Footer */}
        <footer className="mt-16 border-t border-border/80 pt-8 pb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary live-dot-green" />
              <span className="font-semibold text-foreground">CricIQ Pro</span>
              <span>·</span>
              <span>IPL Cricket Intelligence & ML Predictive Engine</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px]">
              <span className="flex items-center gap-1 text-primary">
                <Cpu className="h-3.5 w-3.5" /> 55 ML Features
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-secondary">
                <Sparkles className="h-3.5 w-3.5" /> SHAP Explainability
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-chart-3">
                <ShieldCheck className="h-3.5 w-3.5" /> Data Synced Live
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
