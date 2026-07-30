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

const RELATIVE_TIME = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' })

/** Short relative time for recent timestamps (e.g. "hace 3 h"), falling back
 * to an absolute date once it's more than a week old. */
export function formatRelativeDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  const diffMs = date.getTime() - Date.now()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (Math.abs(diffHours) < 1) {
    const diffMinutes = Math.round(diffMs / (1000 * 60))
    return RELATIVE_TIME.format(diffMinutes, 'minute')
  }
  if (Math.abs(diffHours) < 24) {
    return RELATIVE_TIME.format(Math.round(diffHours), 'hour')
  }
  const diffDays = diffHours / 24
  if (Math.abs(diffDays) < 7) {
    return RELATIVE_TIME.format(Math.round(diffDays), 'day')
  }
  return formatDate(value)
}

export function isRecentlyAdded(value: string | null | undefined, hours = 24) {
  if (!value) return false
  return Date.now() - new Date(value).getTime() < hours * 60 * 60 * 1000
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
