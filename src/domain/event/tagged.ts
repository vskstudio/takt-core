export interface TaggedEvent {
  name: string
  props?: Record<string, string>
}

const PREFIX = 'data-takt-prop-'

/** Reads the nearest [data-takt-event] ancestor of `el` into a name + props. */
export function readTaggedEvent(el: Element | null): TaggedEvent | null {
  const tagEl = el?.closest?.('[data-takt-event]') as HTMLElement | null
  if (!tagEl) return null
  const name = (tagEl.getAttribute('data-takt-event') || '').trim()
  if (!name) return null
  const props: Record<string, string> = {}
  for (const a of Array.from(tagEl.attributes)) {
    if (a.name.indexOf(PREFIX) === 0) props[a.name.slice(PREFIX.length)] = a.value
  }
  return Object.keys(props).length ? { name, props } : { name }
}
