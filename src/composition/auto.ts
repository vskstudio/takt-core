import { runSnippet } from './snippet'

type Props = Record<string, string>
type TaktFn = (name: string, opts?: { props?: Props }) => void

// Liste d'extensions de fichiers considérées comme téléchargements (surchargée
// par data-downloads-ext). Volontairement large : documents, archives, médias.
const DEFAULT_EXT = 'pdf,xlsx,docx,pptx,csv,zip,gz,rar,7z,dmg,exe,apk,mp3,mp4,wav,mov,avi,mkv,txt'

// runAuto = tracker de base (runSnippet : pageview, SPA, window.takt, vie privée)
// + extensions automatiques opt-in déclarées dans data-auto : clics sortants,
// téléchargements, événements HTML (tagged) et erreurs 404. Tout passe par
// window.takt posé par runSnippet, donc opt-out / DNT / exclusion localhost
// s'appliquent uniformément ; le nom réservé « pageview » y est déjà refusé.
export function runAuto(el: HTMLScriptElement | null): void {
  runSnippet(el)
  const get = (k: string) => (el ? el.getAttribute(k) : null)
  const takt = (window as unknown as { takt?: TaktFn }).takt
  if (!takt) return

  const auto = (get('data-auto') || '').split(',').map((s) => s.trim()).filter(Boolean)
  const on = (k: string) => auto.includes(k)
  const outbound = on('outbound')
  const downloads = on('downloads')
  const tagged = on('tagged')

  if (outbound || downloads || tagged) {
    const exts = (get('data-downloads-ext') || DEFAULT_EXT)
      .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    const fileRe = new RegExp('\\.(' + exts.join('|') + ')$')

    document.addEventListener(
      'click',
      (e) => {
        const t = e.target as Element | null

        if (tagged) {
          const tagEl = t?.closest?.('[data-takt-event]') as HTMLElement | null
          if (tagEl) {
            const name = tagEl.getAttribute('data-takt-event') || ''
            const props: Props = {}
            for (const a of Array.from(tagEl.attributes)) {
              if (a.name.indexOf('data-takt-prop-') === 0) props[a.name.slice(15)] = a.value
            }
            takt(name, Object.keys(props).length ? { props } : undefined)
          }
        }

        if (!outbound && !downloads) return
        const a = t?.closest?.('a') as HTMLAnchorElement | null
        if (!a?.href) return
        let url: URL
        try { url = new URL(a.href) } catch { return }
        if (url.protocol.indexOf('http')) return
        const dest = url.origin + url.pathname
        if (outbound && url.hostname !== location.hostname) takt('Outbound Link: Click', { props: { url: dest } })
        if (downloads && fileRe.test(url.pathname.toLowerCase())) takt('File Download', { props: { url: dest } })
      },
      true,
    )
  }

  if (on('404')) {
    // Détection hybride : marqueur explicite (page d'erreur servie en 200) ou
    // vrai code HTTP via Navigation Timing (Chrome/Edge récents). Une seule fois.
    let is404 = !!document.querySelector('[data-takt-404],meta[name="takt:404"]')
    if (!is404) {
      try {
        const nav = performance.getEntriesByType('navigation')[0] as
          (PerformanceNavigationTiming & { responseStatus?: number }) | undefined
        if (nav?.responseStatus === 404) is404 = true
      } catch { /* noop */ }
    }
    if (is404) takt('404', { props: { path: location.pathname } })
  }
}

if (typeof document !== 'undefined') {
  const s = document.currentScript as HTMLScriptElement | null
  if (s) runAuto(s)
}
