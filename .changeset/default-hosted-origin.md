---
"@vskstudio/takt-core": minor
---

Default the ingest endpoint and the stats/widget host to the hosted Takt origin (`https://taktlytics.com`).

`init({ domain })`, the `<script>` snippet, `createStats()`, `badgeUrl()` and `embedUrl()` now talk to the hosted service with no extra config — previously they defaulted to a same-origin relative path, which 405s on static sites that have no `/api/event` backend.

**Breaking for first-party proxies / self-hosters:** the old relative default is no longer implicit. To proxy events through your own origin (anti-adblock) pass `endpoint: '/api/event'` (or `data-endpoint="/api/event"`); `scriptOrigin`/`host` still override the default to point at a custom or self-hosted Takt.
