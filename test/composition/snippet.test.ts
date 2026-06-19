import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { runSnippet } from '../../src/composition/snippet'

function scriptEl(attrs: Record<string, string | null> = {}): HTMLScriptElement {
  const s = document.createElement('script')
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null) s.setAttribute(k, v)
  }
  return s
}

describe('runSnippet', () => {
  let beaconMock: ReturnType<typeof vi.fn>
  const realLocation = window.location

  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(window, 'location', { value: realLocation, configurable: true })
    window.history.replaceState({}, '', 'https://example.com/')
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true })
    beaconMock = vi.fn(() => true)
    vi.stubGlobal('navigator', { sendBeacon: beaconMock, doNotTrack: '0' })
    delete (window as { takt?: unknown }).takt
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete (window as { takt?: unknown }).takt
  })

  it('reads data-domain and sends an initial pageview', () => {
    runSnippet(scriptEl({ 'data-domain': 'snippet.test' }))
    expect(beaconMock).toHaveBeenCalledOnce()
    const body = JSON.parse((beaconMock.mock.calls[0] as [string, string])[1])
    expect(body).toMatchObject({ n: 'pageview', d: 'snippet.test' })
  })

  it('falls back to location.hostname when data-domain is absent', () => {
    runSnippet(scriptEl({}))
    const body = JSON.parse((beaconMock.mock.calls[0] as [string, string])[1])
    expect(body.d).toBe('example.com')
  })

  it('derives the endpoint from data-script-origin', () => {
    runSnippet(scriptEl({ 'data-domain': 'snippet.test', 'data-script-origin': 'https://stats.example.com/' }))
    expect((beaconMock.mock.calls[0] as [string, string])[0]).toBe('https://stats.example.com/api/event')
  })

  it('lets data-endpoint win over data-script-origin', () => {
    runSnippet(scriptEl({ 'data-domain': 'snippet.test', 'data-script-origin': 'https://stats.example.com', 'data-endpoint': '/collect' }))
    expect((beaconMock.mock.calls[0] as [string, string])[0]).toBe('/collect')
  })

  it('exposes window.takt for custom events', () => {
    runSnippet(scriptEl({ 'data-domain': 'snippet.test' }))
    const takt = (window as unknown as { takt: (n: string, o?: unknown) => void }).takt
    takt('Signup', { props: { plan: 'pro' } })
    const bodies = (beaconMock.mock.calls as [string, string][]).map(([, b]) => JSON.parse(b))
    expect(bodies).toContainEqual(expect.objectContaining({ n: 'Signup', p: { plan: 'pro' } }))
  })

  it('replays the bootstrap queue (takt.q)', () => {
    const stub = function (this: unknown, ...a: unknown[]) {
      ;(stub.q = stub.q || []).push(a)
    } as { (...a: unknown[]): void; q?: unknown[][] }
    stub('Early')
    ;(window as unknown as { takt: typeof stub }).takt = stub
    runSnippet(scriptEl({ 'data-domain': 'snippet.test' }))
    const bodies = (beaconMock.mock.calls as [string, string][]).map(([, b]) => JSON.parse(b))
    expect(bodies).toContainEqual(expect.objectContaining({ n: 'Early' }))
  })

  it('strips query and hash from the page url by default', () => {
    window.history.replaceState({}, '', 'https://example.com/checkout?token=secret#step2')
    beaconMock.mockClear() // ignore any stale SPA listeners patched by earlier tests
    runSnippet(scriptEl({ 'data-domain': 'snippet.test' }))
    const calls = beaconMock.mock.calls as [string, string][]
    const last = calls[calls.length - 1]
    expect(JSON.parse(last[1]).u).toBe('https://example.com/checkout')
  })

  it('strips the query by default (no data-track-query or data-query-params)', () => {
    window.history.replaceState({}, '', 'https://example.com/checkout?utm_source=x')
    beaconMock.mockClear()
    runSnippet(scriptEl({ 'data-domain': 'snippet.test' }))
    const calls = beaconMock.mock.calls as [string, string][]
    const last = calls[calls.length - 1]
    expect(JSON.parse(last[1]).u).toBe('https://example.com/checkout')
  })

  it('does not send when opt-out is active (blocking test)', () => {
    localStorage.setItem('takt_ignore', '1')
    runSnippet(scriptEl({ 'data-domain': 'snippet.test' }))
    // No pageview should have been sent
    expect(beaconMock).not.toHaveBeenCalled()
  })

  it('does not send when Do Not Track is enabled (blocking test)', () => {
    vi.stubGlobal('navigator', { sendBeacon: beaconMock, doNotTrack: '1' })
    runSnippet(scriptEl({ 'data-domain': 'snippet.test' }))
    expect(beaconMock).not.toHaveBeenCalled()
  })

  it('respects data-exclude-localhost=false', () => {
    // When excludeLocalhost is false, localhost should NOT be blocked
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost', href: 'http://localhost:3000/', href_: '' },
      configurable: true,
    })
    runSnippet(scriptEl({ 'data-domain': 'snippet.test', 'data-exclude-localhost': 'false' }))
    expect(beaconMock).toHaveBeenCalledOnce()
  })

  it('does nothing when data-enabled is false (kill-switch)', () => {
    runSnippet(scriptEl({ 'data-domain': 'snippet.test', 'data-enabled': 'false' }))
    expect(beaconMock).not.toHaveBeenCalled()
  })

  it('sends despite Do Not Track when data-respect-dnt is false', () => {
    vi.stubGlobal('navigator', { sendBeacon: beaconMock, doNotTrack: '1' })
    runSnippet(scriptEl({ 'data-domain': 'snippet.test', 'data-respect-dnt': 'false' }))
    expect(beaconMock).toHaveBeenCalledOnce()
  })

  it('drops every event when data-sample-rate is 0', () => {
    runSnippet(scriptEl({ 'data-domain': 'snippet.test', 'data-sample-rate': '0' }))
    expect(beaconMock).not.toHaveBeenCalled()
  })

  it('keeps the full query and hash when data-track-query is present', () => {
    window.history.replaceState({}, '', 'https://example.com/checkout?utm_source=x#h')
    beaconMock.mockClear()
    runSnippet(scriptEl({ 'data-domain': 'snippet.test', 'data-track-query': 'true' }))
    const calls = beaconMock.mock.calls as [string, string][]
    expect(JSON.parse(calls[calls.length - 1][1]).u).toBe('https://example.com/checkout?utm_source=x#h')
  })

  it('strips the query when data-track-query is explicitly "false" (SDK parity)', () => {
    window.history.replaceState({}, '', 'https://example.com/checkout?token=secret#h')
    beaconMock.mockClear()
    runSnippet(scriptEl({ 'data-domain': 'snippet.test', 'data-track-query': 'false' }))
    const calls = beaconMock.mock.calls as [string, string][]
    expect(JSON.parse(calls[calls.length - 1][1]).u).toBe('https://example.com/checkout')
  })

  it('keeps only allow-listed params from data-query-params', () => {
    window.history.replaceState({}, '', 'https://example.com/p?utm_source=x&secret=y')
    beaconMock.mockClear()
    runSnippet(scriptEl({ 'data-domain': 'snippet.test', 'data-query-params': 'utm_source' }))
    const calls = beaconMock.mock.calls as [string, string][]
    expect(JSON.parse(calls[calls.length - 1][1]).u).toBe('https://example.com/p?utm_source=x')
  })
})
