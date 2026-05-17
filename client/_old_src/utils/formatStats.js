/** CricIQ — Stat formatting utilities */

export function formatRuns(n) {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  return n?.toLocaleString() || '0';
}

export function formatSR(sr) {
  return sr ? sr.toFixed(1) : '0.0';
}

export function formatAvg(avg) {
  return avg ? avg.toFixed(1) : '0.0';
}

export function formatEconomy(econ) {
  return econ ? econ.toFixed(2) : '0.00';
}

export function formatPct(pct) {
  return pct ? `${pct.toFixed(1)}%` : '0.0%';
}

export function formatPrice(lakh) {
  if (!lakh) return '—';
  if (lakh >= 100) return `₹${(lakh / 100).toFixed(1)}Cr`;
  return `₹${lakh.toFixed(0)}L`;
}

export function getScoreColor(score) {
  if (score >= 75) return '#00C851';
  if (score >= 60) return '#FF6B00';
  if (score >= 45) return '#F9CD05';
  return '#FF3D3D';
}

export function getTrendIcon(trend) {
  if (trend === 'improving') return '📈';
  if (trend === 'declining') return '📉';
  return '➡️';
}

export function getTrendColor(trend) {
  if (trend === 'improving') return '#00C851';
  if (trend === 'declining') return '#FF3D3D';
  return '#F9CD05';
}
