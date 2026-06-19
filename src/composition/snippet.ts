type TaktFn = ((name: string, opts?: unknown) => void) & { q?: unknown[][] }
type Opts = { props?: Record<string, string>; revenue?: { amount: string; currency: string } } | undefined

// runSnippet is exported for testing; the IIFE tail below auto-runs it in the browser.
export function runSnippet(el: HTMLScriptElement | null): void {
  const get = (k: string) => (el ? el.getAttribute(k) : null)

  // data-enabled="false" : kill-switch total (aucun listener, aucun envoi).
  if (get('data-enabled') === 'false') return

  const domain = get('data-domain') || location.hostname
  // data-script-origin (first-party / anti-adblock) : origine d'où Takt sert
  // l'ingest (domaine Takt ou domaine custom du client). data-endpoint reste
  // prioritaire ; sinon on dérive {origin}/api/event, défaut relatif.
  const origin = get('data-script-origin')
  const endpoint = get('data-endpoint') || (origin ? origin.replace(/\/+$/, '') + '/api/event' : '/api/event')
  const excl = get('data-exclude-localhost') !== 'false'
  const dnt = get('data-respect-dnt') !== 'false'
  const rate = parseFloat(get('data-sample-rate') || '1')
  const keepQuery = get('data-track-query') !== null
  const allow = (get('data-query-params') || '').split(',').map((s) => s.trim()).filter(Boolean)

  // Default strips query + hash. Precedence: trackQuery (keep all) wins over the
  // allowlist, which wins over the default strip — mirrors createUrlScrubber.
  const scrub = (raw: string) => {
    try {
      const u = new URL(raw)
      if (keepQuery) return u.origin + u.pathname + u.search
      if (allow.length) {
        const kept = new URLSearchParams()
        for (const n of allow) { const v = u.searchParams.get(n); if (v !== null) kept.set(n, v) }
        const qs = kept.toString()
        return u.origin + u.pathname + (qs ? '?' + qs : '')
      }
      return u.origin + u.pathname
    } catch { return raw }
  }

  // Frozen short-circuit order: opt-out → DNT → localhost → sampling.
  function emit(name: string, opts?: Opts): void {
    try { if (localStorage.getItem('takt_ignore') === '1') return } catch { /* noop */ }
    // Standard DNT value only; the full SDK also honors the legacy 'yes'
    // (old Firefox/Safari) — omitted here to stay within the ≤ 1 kB budget.
    if (dnt && navigator.doNotTrack === '1') return
    if (excl) {
      const h = location.hostname
      if (h === 'localhost' || h === '::1' || h === '0.0.0.0' || h.endsWith('.local') ||
          /^(127|10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(h)) return
    }
    if (rate < 1 && Math.random() >= rate) return
    const p: Record<string, unknown> = { n: name, d: domain, u: scrub(location.href), r: scrub(document.referrer), w: innerWidth }
    if (opts?.props && Object.keys(opts.props).length) p.p = opts.props
    if (opts?.revenue) p.$ = { a: opts.revenue.amount, c: opts.revenue.currency.toUpperCase() }
    const b = JSON.stringify(p)
    try {
      if (!navigator.sendBeacon?.(endpoint, b))
        void fetch(endpoint, { method: 'POST', body: b, keepalive: true }).catch(() => {})
    } catch { /* best-effort */ }
  }

  function track(name: string, opts?: Opts): void {
    if (typeof name !== 'string') return
    const n = name.trim()
    if (n && n !== 'pageview') emit(n, opts)
  }

  function pv(): void { emit('pageview') }

  for (const k of ['pushState', 'replaceState'] as const) {
    const o = history[k]
    history[k] = function (this: History, ...a: Parameters<History['pushState']>) {
      const r = o.apply(this, a); pv(); return r
    }
  }
  addEventListener('popstate', pv)
  addEventListener('hashchange', pv)
  pv()

  const win = window as unknown as { takt?: TaktFn }
  const q = win.takt?.q
  win.takt = track as TaktFn
  if (q) for (const a of q) track(...(a as [string, Opts?]))
}
