import { describe, it, expect, vi, afterEach } from 'vitest'
import { createStats, PublicApiError } from '../../src/composition/index'

function mockFetch(status: number, body: unknown) {
  return vi.fn(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('stats/client', () => {
  it('builds the summary URL with host, domain and params', async () => {
    const f = mockFetch(200, { visitors: 1, pageviews: 2, avgDurationS: 3, bounceRate: 0.1 })
    vi.stubGlobal('fetch', f)
    const stats = createStats({ host: 'https://t.io', domain: 'example.com' })
    const res = await stats.summary(undefined, { period: '30d', compare: 'previous' })
    expect(res.visitors).toBe(1)
    expect(f).toHaveBeenCalledWith(
      'https://t.io/api/v1/public/sites/example.com/stats/summary?period=30d&compare=previous',
      expect.objectContaining({ method: 'GET', credentials: 'omit' }),
    )
  })

  it('realtime hits the realtime resource with no query', async () => {
    const f = mockFetch(200, { visitors: 7 })
    vi.stubGlobal('fetch', f)
    const stats = createStats({ domain: 'a.com' })
    expect((await stats.realtime()).visitors).toBe(7)
    expect(f).toHaveBeenCalledWith(
      '/api/v1/public/sites/a.com/stats/realtime',
      expect.anything(),
    )
  })

  it('breakdown returns rows directly', async () => {
    const f = mockFetch(200, { dimension: 'page', rows: [{ label: '/', visitors: 5, pageviews: 9 }] })
    vi.stubGlobal('fetch', f)
    const stats = createStats({ domain: 'a.com' })
    const rows = await stats.breakdown('page')
    expect(rows).toEqual([{ label: '/', visitors: 5, pageviews: 9 }])
  })

  it('throws PublicApiError with the API message on non-2xx', async () => {
    vi.stubGlobal('fetch', mockFetch(404, { error: { message: 'not found' } }))
    const stats = createStats({ domain: 'a.com' })
    await expect(stats.summary()).rejects.toMatchObject({ status: 404, message: 'not found' })
    await expect(stats.summary()).rejects.toBeInstanceOf(PublicApiError)
  })

  it('requires a domain', async () => {
    const stats = createStats()
    await expect(stats.realtime()).rejects.toThrow(/domain is required/)
  })
})
