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
})
