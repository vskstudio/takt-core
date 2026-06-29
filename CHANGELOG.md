# @vskstudio/takt-core

## 0.6.0

### Minor Changes

- 64ad8d1: Default the ingest endpoint and the stats/widget host to the hosted Takt origin (`https://taktlytics.com`).

  `init({ domain })`, the `<script>` snippet, `createStats()`, `badgeUrl()` and `embedUrl()` now talk to the hosted service with no extra config — previously they defaulted to a same-origin relative path, which 405s on static sites that have no `/api/event` backend.

  **Breaking for first-party proxies / self-hosters:** the old relative default is no longer implicit. To proxy events through your own origin (anti-adblock) pass `endpoint: '/api/event'` (or `data-endpoint="/api/event"`); `scriptOrigin`/`host` still override the default to point at a custom or self-hosted Takt.

## 0.5.1

### Patch Changes

- Harden outbound/download autocapture: the link protocol is now matched
  explicitly against `http:`/`https:` instead of the fragile
  `protocol.indexOf('http')` test, so only real web links are ever reported.

## 0.5.0

### Minor Changes

- 7953536: Advanced tracker options. Snippet gains data-enabled, data-respect-dnt,
  data-sample-rate, data-track-query and data-query-params. init() gains a
  `tagged` autocapture option (via the new Analytics.enableTagged()), making the
  SDK path a superset of the snippet.

## 0.3.1

### Patch Changes

- Harden the widget URL builders and stats client: `host` must now be empty (same-origin) or an absolute `http(s)://` origin — `javascript:`, `data:`, and protocol-relative (`//…`) values are rejected so they can never reach a widget `src` or a `fetch`. Also map non-JSON success bodies to `PublicApiError`. Exports the `normalizeHost` helper.

## 0.3.0

### Minor Changes

- Add server-rendered widget URL builders (`badgeUrl`, `embedUrl`) and an anonymous public stats client (`createStats` → summary/timeseries/realtime/breakdown), with `PublicApiError` and the associated widget/stats types. Framework-agnostic and tree-shakeable.

## 0.2.2

### Patch Changes

- TSDoc on the public API (`init`, `track`, `pageview`, `optOut`, `optIn`, `InitOptions`, `Config`) for IDE hover, plus package metadata (`author`, `engines.node`, `unpkg`/`jsdelivr` for the CDN snippet). No runtime change.

## 0.2.1

### Patch Changes

- Refresh package metadata and publish with a signed npm provenance attestation. Documents the snippet's intentional Do Not Track divergence from the full SDK (the inline snippet checks the standard `'1'` only to stay within the ≤1 kB budget). No runtime change.

## 0.2.0

### Minor Changes

- Privacy hardening and new features.

  - **URL scrubbing**: query string and hash are stripped from every URL (page, referrer, autocaptured link destinations) by default. Configurable via `trackQuery`, a `queryParams` allowlist, or a custom `scrubUrl` function.
  - **Input validation**: props are coerced to strings, capped (30 keys, 64-char keys, 1024-char values); revenue is dropped unless the amount and 3-letter currency are well-formed. Clamps warn once in the console.
  - **New options**: `enabled`, `debug`, and `sampleRate`.
  - **SPA**: `replaceState` and `hashchange` are now tracked in addition to `pushState`/`popstate`.
  - **Idempotent `init()`**: re-initialising disposes the previous instance's listeners.
  - **Autocapture**: `mailto:` / `tel:` and other non-http links are skipped; link destination URLs are scrubbed.
  - Expanded localhost/private-IP detection (`::1`, `0.0.0.0`).
  - Removed dead transport adapters.

## 0.1.1

### Patch Changes

- Publication via npm Trusted Publishing / token CI (pas de changement de code).

## 0.1.0

### Minor Changes

- c18348c: Première version publique de `@vskstudio/takt-core` : SDK d'analytics minimaliste et respectueux de la vie privée, en architecture hexagonale.

  - `createTakt(config)` — instance avec `track`, `pageview`, `optOut`/`optIn`, et `enableSpa`/`enableOutbound`/`enableFiles` qui renvoient des disposers.
  - Helpers top-level `init`/`track`/`pageview`/`optOut`/`optIn` sur une instance par défaut.
  - Snippet IIFE ≤ 1 kB gzip avec configuration `data-*`, file d'attente de bootstrap et `window.takt`.
  - Respect de l'opt-out, de Do Not Track, et exclusion localhost/IP privées par défaut.
