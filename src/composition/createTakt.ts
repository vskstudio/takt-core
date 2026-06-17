import { Analytics } from '../application/Analytics'
import type { AnalyticsConfig } from '../application/Analytics'
import { ResilientTransport } from '../infrastructure/transport/ResilientTransport'
import { LocalStorageConsentStore } from '../infrastructure/consent/LocalStorageConsentStore'
import { NavigatorDntProvider } from '../infrastructure/browser/NavigatorDntProvider'
import { WindowEnvironmentProvider } from '../infrastructure/browser/WindowEnvironmentProvider'
import { HistoryNavigationProvider } from '../infrastructure/browser/HistoryNavigationProvider'
import { DocumentClickSource } from '../infrastructure/browser/DocumentClickSource'
import createUrlScrubber, { type UrlScrubber } from '../domain/url/UrlScrubber'

/** Configuration for {@link createTakt} — the core SDK without the autocapture toggles. */
export interface Config {
  domain?: string
  endpoint?: string
  scriptOrigin?: string
  respectDnt?: boolean
  excludeLocalhost?: boolean
  enabled?: boolean
  debug?: boolean
  sampleRate?: number
  trackQuery?: boolean
  queryParams?: string[]
  scrubUrl?: UrlScrubber
}

/**
 * Resolve the ingest endpoint. `endpoint` wins if given; otherwise, when a
 * `scriptOrigin` is set (first-party / anti-adblock: the Takt domain or a custom
 * domain), derive `${origin}/api/event`. Falls back to a same-origin relative
 * path.
 */
export function resolveEndpoint(endpoint?: string, scriptOrigin?: string): string {
  if (endpoint) return endpoint
  if (scriptOrigin) return scriptOrigin.replace(/\/+$/, '') + '/api/event'
  return '/api/event'
}

/**
 * Create a standalone instance the caller owns — privacy defaults on, but no
 * autocapture and no module singleton (unlike {@link init}).
 */
export function createTakt(config: Config = {}): Analytics {
  const resolvedConfig: AnalyticsConfig = {
    domain: config.domain || location.hostname,
    endpoint: resolveEndpoint(config.endpoint, config.scriptOrigin),
    respectDnt: config.respectDnt ?? true,
    excludeLocalhost: config.excludeLocalhost ?? true,
    enabled: config.enabled ?? true,
    debug: config.debug ?? false,
    sampleRate: config.sampleRate ?? 1,
    scrubUrl: createUrlScrubber({
      trackQuery: config.trackQuery,
      queryParams: config.queryParams,
      custom: config.scrubUrl,
    }),
  }

  return new Analytics(
    resolvedConfig,
    new ResilientTransport(resolvedConfig.endpoint),
    new LocalStorageConsentStore(),
    new NavigatorDntProvider(),
    new WindowEnvironmentProvider(),
    new HistoryNavigationProvider(),
    new DocumentClickSource(),
  )
}
