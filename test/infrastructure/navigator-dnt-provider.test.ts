import { describe, it, expect, afterEach, vi } from 'vitest'
import { NavigatorDntProvider } from '../../src/infrastructure/browser/NavigatorDntProvider'

describe('NavigatorDntProvider', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  const provider = new NavigatorDntProvider()

  it('is enabled when Do Not Track is "1"', () => {
    vi.stubGlobal('navigator', { doNotTrack: '1' })
    expect(provider.isEnabled()).toBe(true)
  })

  it('is enabled when Do Not Track is the legacy "yes"', () => {
    vi.stubGlobal('navigator', { doNotTrack: 'yes' })
    expect(provider.isEnabled()).toBe(true)
  })

  it('is enabled when Global Privacy Control is set', () => {
    vi.stubGlobal('navigator', { doNotTrack: '0', globalPrivacyControl: true })
    expect(provider.isEnabled()).toBe(true)
  })

  it('is disabled when neither signal is set', () => {
    vi.stubGlobal('navigator', { doNotTrack: '0', globalPrivacyControl: false })
    expect(provider.isEnabled()).toBe(false)
  })
})
