export function scoreColor(score: number | null | undefined): 'success' | 'warning' | 'error' | 'neutral' {
  if (score == null) return 'neutral'
  if (score >= 7) return 'success'
  if (score >= 5) return 'warning'
  return 'error'
}

export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  inferred = false
) {
  if (min == null && max == null) return '—'
  const range = min != null && max != null
    ? `$${min.toLocaleString()}–$${max.toLocaleString()}`
    : min != null
      ? `$${min.toLocaleString()}+`
      : `up to $${max!.toLocaleString()}`
  return inferred ? `~${range}` : range
}

export function bestFitScore(analyses: { fit_score: number }[] | undefined) {
  if (!analyses?.length) return null
  return Math.max(...analyses.map(a => a.fit_score))
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
