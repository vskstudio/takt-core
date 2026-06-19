import { describe, it, expect } from 'vitest'
import { readTaggedEvent } from '../../src/domain/event/tagged'

function el(attrs: Record<string, string>): HTMLElement {
  const node = document.createElement('button')
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  return node
}

describe('readTaggedEvent', () => {
  it('returns null for elements without data-takt-event', () => {
    expect(readTaggedEvent(el({}))).toBeNull()
    expect(readTaggedEvent(null)).toBeNull()
  })

  it('reads the event name with no props', () => {
    expect(readTaggedEvent(el({ 'data-takt-event': 'Cta' }))).toEqual({ name: 'Cta' })
  })

  it('collects data-takt-prop-* into props', () => {
    const node = el({ 'data-takt-event': 'Cta', 'data-takt-prop-zone': 'hero', 'data-takt-prop-id': '7' })
    expect(readTaggedEvent(node)).toEqual({ name: 'Cta', props: { zone: 'hero', id: '7' } })
  })

  it('matches the nearest [data-takt-event] ancestor', () => {
    const outer = el({ 'data-takt-event': 'Cta' })
    const inner = document.createElement('span')
    outer.appendChild(inner)
    expect(readTaggedEvent(inner)).toEqual({ name: 'Cta' })
  })

  it('returns null when the name attribute is empty', () => {
    expect(readTaggedEvent(el({ 'data-takt-event': '' }))).toBeNull()
  })
})
