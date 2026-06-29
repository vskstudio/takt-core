// Anonymous client for Takt's PUBLIC stats API (`/api/v1/public/sites/{domain}/stats/*`).
// Mirrors the server response shapes 1:1. Calls are credential-less (no cookies); errors
// surface as {@link PublicApiError}. Used by the framework wrappers to power live widgets
// and custom dashboards without touching the authenticated session API.

import { normalizeHost } from '../widget/url'

export type StatsPeriod = '24h' | '7d' | '30d' | '90d' | '12mo' | 'custom'
export type StatsDimension =
  | 'page'
  | 'referrer'
  | 'source'
  | 'country'
  | 'region'
  | 'city'
  | 'browser'
  | 'os'
  | 'device'
  | 'utm_source'
  | 'utm_medium'
  | 'utm_campaign'

export interface StatsMetrics {
  visitors: number
  pageviews: number
  avgDurationS: number
  bounceRate: number
}

export interface StatsSummary extends StatsMetrics {
  previous?: StatsMetrics
}

export interface StatsPoint {
  at: string
  visitors: number
  pageviews: number
}

export interface StatsTimeseries {
  interval: string
  points: StatsPoint[]
  previous?: StatsPoint[]
}

export interface StatsBreakdownRow {
  label: string
  visitors: number
  pageviews: number
}

export interface StatsBreakdown {
  dimension: string
  rows: StatsBreakdownRow[]
}

export interface StatsRealtime {
  visitors: number
}

export interface StatsParams {
  period?: StatsPeriod
  from?: string
  to?: string
  tz?: string
  country?: string
  interval?: string
  compare?: 'previous'
}

export interface StatsClientOptions {
  /** Takt host, e.g. `https://takt.example.com`. Defaults to the hosted Takt origin. */
  host?: string
  /** Default domain so per-call `domain` becomes optional. */
  domain?: string
}

/** Typed error for the public stats API, carrying the HTTP status. */
export class PublicApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'PublicApiError'
    this.status = status
  }
}

function buildQuery(entries: Record<string, string | undefined>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(entries)) {
    if (value !== undefined && value !== '') qs.set(key, value)
  }
  const str = qs.toString()
  return str ? `?${str}` : ''
}

async function publicGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const payload = (await res.json()) as { error?: { message?: string } }
      if (payload?.error?.message) message = payload.error.message
    } catch {
      /* non-JSON body: keep statusText */
    }
    throw new PublicApiError(res.status, message)
  }
  try {
    return (await res.json()) as T
  } catch {
    throw new PublicApiError(res.status, 'invalid JSON response')
  }
}

export interface StatsClient {
  summary(domain?: string, params?: StatsParams): Promise<StatsSummary>
  timeseries(domain?: string, params?: StatsParams): Promise<StatsTimeseries>
  realtime(domain?: string): Promise<StatsRealtime>
  breakdown(dimension: StatsDimension, domain?: string, params?: StatsParams): Promise<StatsBreakdownRow[]>
}

/** Create a stats client bound to a host (and optionally a default domain). */
export function createStats(opts: StatsClientOptions = {}): StatsClient {
  const base = `${normalizeHost(opts.host)}/api/v1/public/sites`
  const path = (domain: string, resource: string) =>
    `${base}/${encodeURIComponent(domain)}/stats/${resource}`
  const pick = (domain?: string): string => {
    const d = domain ?? opts.domain
    if (!d) throw new Error('takt: domain is required (pass one, or set it on createStats)')
    return d
  }

  return {
    async summary(domain, params = {}) {
      const query = buildQuery({
        period: params.period,
        from: params.from,
        to: params.to,
        tz: params.tz,
        compare: params.compare,
      })
      return publicGet<StatsSummary>(path(pick(domain), 'summary') + query)
    },
    async timeseries(domain, params = {}) {
      const query = buildQuery({
        period: params.period,
        from: params.from,
        to: params.to,
        tz: params.tz,
        interval: params.interval,
        compare: params.compare,
      })
      return publicGet<StatsTimeseries>(path(pick(domain), 'timeseries') + query)
    },
    async realtime(domain) {
      return publicGet<StatsRealtime>(path(pick(domain), 'realtime'))
    },
    async breakdown(dimension, domain, params = {}) {
      const query = buildQuery({
        dimension,
        period: params.period,
        from: params.from,
        to: params.to,
        tz: params.tz,
        country: params.country,
      })
      const data = await publicGet<StatsBreakdown>(path(pick(domain), 'breakdown') + query)
      return data.rows
    },
  }
}
