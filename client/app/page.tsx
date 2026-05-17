"use client"

import { useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { NavTabs, type TabKey } from "@/components/nav-tabs"
import { MatchPredictor } from "@/components/match-predictor"
import { PlayerScout } from "@/components/player-scout"
import { AuctionIntelligence } from "@/components/auction-intelligence"
import { MatchupExplorer } from "@/components/matchup-explorer"
import { VenueIntel } from "@/components/venue-intel"

export default function Page() {
  const [tab, setTab] = useState<TabKey>("predictor")

  return (
    <div className="relative min-h-dvh bg-background text-foreground">
      <div className="pitch-pattern pointer-events-none fixed inset-0 -z-10 opacity-60" aria-hidden />
      <SiteHeader />
      <NavTabs active={tab} onChange={setTab} />
      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {tab === "predictor" && <MatchPredictor />}
        {tab === "scout" && <PlayerScout />}
        {tab === "auction" && <AuctionIntelligence />}
        {tab === "matchup" && <MatchupExplorer />}
        {tab === "venue" && <VenueIntel />}
        <footer className="mt-12 border-t border-border/60 pt-6 pb-2 text-center text-[11px] text-muted-foreground">
          CricIQ · IPL Intelligence Platform · Data refreshed{" "}
          <span className="text-foreground">2 min ago</span>
        </footer>
      </main>
    </div>
  )
}
