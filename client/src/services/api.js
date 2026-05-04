/** CricIQ — Centralized API service (all axios calls) */
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Teams & Venues ──────────────────────────────────────
export const fetchTeams = () => API.get('/teams').then(r => r.data);
export const fetchVenues = () => API.get('/venues').then(r => r.data);

// ── Prediction ──────────────────────────────────────────
export const predictMatch = (data) => API.post('/predict', data).then(r => r.data);
export const getPredictionHistory = () => API.get('/predict/history').then(r => r.data);
export const savePrediction = (data) => API.post('/predict/save', data).then(r => r.data);

// ── Players ─────────────────────────────────────────────
export const searchPlayers = (q, role = '') =>
  API.get('/players/search', { params: { q, role } }).then(r => r.data);

export const getPlayer = (name) =>
  API.get(`/players/${encodeURIComponent(name)}`).then(r => r.data);

export const getPlayerVenues = (name) =>
  API.get(`/players/${encodeURIComponent(name)}/venues`).then(r => r.data);

export const getPlayerMatchups = (name) =>
  API.get(`/players/${encodeURIComponent(name)}/matchups`).then(r => r.data);

// ── Auction ─────────────────────────────────────────────
export const getAuctionFilters = () => API.get('/auction/filters').then(r => r.data);
export const getAuctionRecommendation = (data) =>
  API.post('/auction/recommend', data).then(r => r.data);

// ── Search ──────────────────────────────────────────────
export const globalSearch = (q, role = '', min_score = 0) =>
  API.get('/search', { params: { q, role, min_score } }).then(r => r.data);

export default API;
