/** CricIQ — Centralized API service (mirrors _old_src/services/api.js) */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || err.detail || "API request failed")
  }
  return res.json()
}

// ── Teams & Venues ──────────────────────────────────────
export const fetchTeams = () => apiFetch<any[]>("/teams")
export const fetchVenues = () => apiFetch<string[]>("/venues")

// ── Prediction ──────────────────────────────────────────
export const predictMatch = (data: any) =>
  apiFetch<any>("/predict", { method: "POST", body: JSON.stringify(data) })

// ── Players ─────────────────────────────────────────────
export const searchPlayers = (q: string, role = "") =>
  apiFetch<any>(`/players/search?q=${encodeURIComponent(q)}&role=${role}`)

export const getPlayer = (name: string) =>
  apiFetch<any>(`/players/${encodeURIComponent(name)}`)

export const getPlayerList = () => apiFetch<any>("/players/list")

export const getPlayerVenues = (name: string) =>
  apiFetch<any>(`/players/${encodeURIComponent(name)}/venues`)

export const getPlayerMatchups = (name: string) =>
  apiFetch<any>(`/players/${encodeURIComponent(name)}/matchups`)

// ── Auction ─────────────────────────────────────────────
export const getAuctionFilters = () => apiFetch<any>("/auction/filters")
export const getAuctionRecommendation = (data: any) =>
  apiFetch<any>("/auction/recommend", { method: "POST", body: JSON.stringify(data) })

// ── Search ──────────────────────────────────────────────
export const globalSearch = (q: string, role = "", min_score = 0) =>
  apiFetch<any>(`/search?q=${encodeURIComponent(q)}&role=${role}&min_score=${min_score}`)

// ── Matchup ──────────────────────────────────────────────
export const getMatchup = (batter: string, bowler: string) =>
  apiFetch<any>("/matchup", { method: "POST", body: JSON.stringify({ batter, bowler }) })

export { API_BASE }
