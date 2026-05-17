export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export type Team = {
  id: string
  name: string
  short: string
  city: string
  primary: string
  secondary: string
}

export type Venue = {
  id: string
  name: string
  city: string
  avgScore: number
  batFirstWin: number
  pitch: string
  shortName?: string
  dewFactor?: string
}

export type PlayerRole = "Batter" | "Bowler" | "All-rounder" | "Wicket-keeper"

export type Player = {
  id: string
  name: string
  role: string
  team: string
  country: string
  countryCode: string
  score: number
  archetype: string
  matches: number
  runs?: number
  sr?: number
  wickets?: number
  economy?: number
  avg?: number
  fairValue: number
  phase: {
    powerplay: number
    middle: number
    death: number
  }
  trend: { season: string; value: number }[]
}

// Fallback data for initial render or SSR
export const TEAMS: Team[] = [
  { id: 'mi', name: 'Mumbai Indians', short: 'MI', city: 'Mumbai', primary: '#004BA0', secondary: '#D1AB3E' },
  { id: 'csk', name: 'Chennai Super Kings', short: 'CSK', city: 'Chennai', primary: '#F9CD05', secondary: '#FF6B00' },
  { id: 'rcb', name: 'Royal Challengers Bengaluru', short: 'RCB', city: 'Bengaluru', primary: '#EC1C24', secondary: '#B8860B' },
  { id: 'kkr', name: 'Kolkata Knight Riders', short: 'KKR', city: 'Kolkata', primary: '#3A225D', secondary: '#B8860B' },
  { id: 'srh', name: 'Sunrisers Hyderabad', short: 'SRH', city: 'Hyderabad', primary: '#F7A721', secondary: '#E03A3E' },
]

export const VENUES: Venue[] = [
  { id: 'wankhede', name: 'Wankhede Stadium', city: 'Mumbai', avgScore: 172, batFirstWin: 48, pitch: 'Balanced', shortName: 'Wankhede Stadium', dewFactor: 'High' },
  { id: 'chepauk', name: 'MA Chidambaram Stadium', city: 'Chennai', avgScore: 158, batFirstWin: 62, pitch: 'Spin-friendly', shortName: 'MA Chidambaram Stadium', dewFactor: 'Low' },
]

export const PLAYERS: Player[] = [] // Empty by default, fetched from backend
