import { createTakt } from './createTakt'
import type { Analytics, TrackOptions } from '../application/Analytics'
import type { UrlScrubber } from '../domain/url/UrlScrubber'

export { createTakt }
export type { Config } from './createTakt'
export type { TrackOptions } from '../application/Analytics'
export type { Payload } from '../domain/event/Payload'

// Server-rendered widget URL builders.
export { badgeUrl, embedUrl } from '../widget/url'
export type {
  BadgeOptions,
  EmbedOptions,
  BadgeVariant,
  BadgeGlyph,
  EmbedTheme,
  WidgetLang,
} from '../widget/url'

// Public stats client.
export { createStats, PublicApiError } from '../stats/client'
export type {
  StatsClient,
  StatsClientOptions,
  StatsParams,
  StatsPeriod,
  StatsDimension,
  StatsMetrics,
  StatsSummary,
  StatsPoint,
  StatsTimeseries,
  StatsBreakdownRow,
  StatsBreakdown,
  StatsRealtime,
} from '../stats/client'

export type Revenue = { amount: string; currency: string }

let _instance: Analytics | null = null
let _disposers: Array<() => void> = []

/** Options for {@link init} — `createTakt`'s {@link Config} plus the autocapture toggles. */
export interface InitOptions {
  domain?: string
  endpoint?: string
  respectDnt?: boolean
  excludeLocalhost?: boolean
  enabled?: boolean
  debug?: boolean
  sampleRate?: number
  trackQuery?: boolean
  queryParams?: string[]
  scrubUrl?: UrlScrubber
  auto?: boolean
  outbound?: boolean
  files?: boolean
  fileExtensions?: string[]
}

/**
 * Bootstrap the default instance: create it, enable requested autocapture, and —
 * unless `auto` is `false` — start SPA tracking and fire an initial pageview.
 */
export function init(opts: InitOptions = {}): Analytics {
  _reset()

  _instance = createTakt({
    domain: opts.domain,
    endpoint: opts.endpoint,
    respectDnt: opts.respectDnt,
    excludeLocalhost: opts.excludeLocalhost,
    enabled: opts.enabled,
    debug: opts.debug,
    sampleRate: opts.sampleRate,
    trackQuery: opts.trackQuery,
    queryParams: opts.queryParams,
    scrubUrl: opts.scrubUrl,
  })

  if (opts.outbound) _disposers.push(_instance.enableOutbound())
  if (opts.files) _disposers.push(_instance.enableFiles(opts.fileExtensions))
  if (opts.auto !== false) {
    _disposers.push(_instance.enableSpa())
    _instance.pageview()
  }

  return _instance
}

/** Track a custom event on the default instance. No-op until {@link init} has run. */
export function track(name: string, opts?: TrackOptions): void {
  _instance?.track(name, opts)
}

/** Send a pageview on the default instance. No-op until {@link init} has run. */
export function pageview(): void {
  _instance?.pageview()
}

/** Opt the visitor out of tracking (persisted). No-op until {@link init} has run. */
export function optOut(): void {
  _instance?.optOut()
}

/** Reverse a previous {@link optOut}. No-op until {@link init} has run. */
export function optIn(): void {
  _instance?.optIn()
}

export function _reset(): void {
  for (const dispose of _disposers) dispose()
  _disposers = []
  _instance = null
}
