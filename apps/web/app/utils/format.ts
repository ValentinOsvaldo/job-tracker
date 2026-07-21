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

function formatOneRange(min: number | null, max: number | null, currency: string) {
  if (min == null && max == null) return null
  const range = min != null && max != null
    ? `$${min.toLocaleString()}–$${max.toLocaleString()}`
    : min != null
      ? `$${min.toLocaleString()}+`
      : `up to $${max!.toLocaleString()}`
  return `${range} ${currency}`
}

export function formatProfileSalaryRanges(profile: {
  salary_min_mxn: number | null
  salary_max_mxn: number | null
  salary_min_usd: number | null
  salary_max_usd: number | null
}) {
  return [
    formatOneRange(profile.salary_min_mxn, profile.salary_max_mxn, 'MXN'),
    formatOneRange(profile.salary_min_usd, profile.salary_max_usd, 'USD')
  ].filter((range): range is string => range !== null)
}

export function cvScoreColor(score: number | null | undefined): 'success' | 'warning' | 'error' | 'neutral' {
  if (score == null) return 'neutral'
  if (score >= 70) return 'success'
  if (score >= 45) return 'warning'
  return 'error'
}
