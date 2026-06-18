import { runSnippet } from './snippet'

// Tracker minimal (< 1 Ko gzip) : pageview + SPA + window.takt. Les captures
// optionnelles (liens sortants, téléchargements) vivent dans takt.auto.js.
if (typeof document !== 'undefined') {
  const s = document.currentScript as HTMLScriptElement | null
  if (s) runSnippet(s)
}
