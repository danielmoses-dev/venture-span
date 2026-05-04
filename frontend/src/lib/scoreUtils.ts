/** Returns Tailwind text colour class for ML score */
export const scoreColor = (score: number | null): string => {
  if (!score) return 'text-ink-tertiary'
  if (score >= 7) return 'score-high'
  if (score >= 5) return 'score-mid'
  return 'score-low'
}

/** Returns badge class for ML score pill */
export const scorePill = (score: number | null): string => {
  if (!score) return 'badge-neutral'
  if (score >= 7) return 'pill-high'
  if (score >= 5) return 'pill-mid'
  return 'pill-low'
}

export const formatCurrency = (val: number): string => {
  if (val >= 1_000_000_000) return `$${(val / 1e9).toFixed(1)}B`
  if (val >= 1_000_000)     return `$${(val / 1e6).toFixed(1)}M`
  if (val >= 1_000)         return `$${(val / 1e3).toFixed(0)}K`
  return `$${val}`
}
