import { describe, it, expect } from 'vitest'
import { badgeUrl, embedUrl } from '../../src/composition/index'

describe('widget/url badgeUrl', () => {
  it('omits default params', () => {
    expect(badgeUrl('example.com')).toBe('/public/example.com/badge.svg')
  })

  it('keeps non-default variant/glyph/lang and respects host', () => {
    expect(badgeUrl('a.com', { host: 'https://t.io', variant: 'd', glyph: 'off', lang: 'en' })).toBe(
      'https://t.io/public/a.com/badge.svg?variant=d&glyph=off&lang=en',
    )
  })

  it('drops default variant a and lang fr but keeps glyph', () => {
    expect(badgeUrl('a.com', { variant: 'a', lang: 'fr', glyph: 'dash' })).toBe(
      '/public/a.com/badge.svg?glyph=dash',
    )
  })

  it('encodes the domain', () => {
    expect(badgeUrl('foo bar.com')).toBe('/public/foo%20bar.com/badge.svg')
  })
})

describe('widget/url embedUrl', () => {
  it('omits default params', () => {
    expect(embedUrl('example.com')).toBe('/embed/example.com')
  })

  it('keeps non-default theme/lang and respects host', () => {
    expect(embedUrl('a.com', { host: 'https://t.io', theme: 'dark', lang: 'en' })).toBe(
      'https://t.io/embed/a.com?theme=dark&lang=en',
    )
  })

  it('encodes the domain', () => {
    expect(embedUrl('foo bar.com')).toBe('/embed/foo%20bar.com')
  })

  it('strips a trailing slash on host', () => {
    expect(embedUrl('a.com', { host: 'https://t.io/' })).toBe('https://t.io/embed/a.com')
  })

  it('reduces a host with a path/query to its origin', () => {
    expect(embedUrl('a.com', { host: 'https://t.io/x?a=1' })).toBe('https://t.io/embed/a.com')
  })
})

describe('widget/url host validation', () => {
  it('accepts empty (relative) and absolute http(s) hosts', () => {
    expect(() => badgeUrl('a.com')).not.toThrow()
    expect(() => badgeUrl('a.com', { host: 'http://t.io' })).not.toThrow()
    expect(() => embedUrl('a.com', { host: 'https://t.io' })).not.toThrow()
  })

  for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.com', 'evil.com', 'ftp://t.io']) {
    it(`rejects unsafe host ${bad}`, () => {
      expect(() => badgeUrl('a.com', { host: bad })).toThrow(/absolute http/)
      expect(() => embedUrl('a.com', { host: bad })).toThrow(/absolute http/)
    })
  }
})
