import type { ClickSource } from '../../application/ports/ClickSource'

function findAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  let el = target as HTMLElement | null
  while (el && el.tagName !== 'A') el = el.parentElement
  return el as HTMLAnchorElement | null
}

export class DocumentClickSource implements ClickSource {
  onAnchorClick(cb: (a: HTMLAnchorElement, e: Event) => void): () => void {
    const handler = (e: Event) => {
      const a = findAnchor(e.target)
      if (a) cb(a, e)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }

  onElementClick(cb: (target: Element, e: Event) => void): () => void {
    const handler = (e: Event) => {
      if (e.target instanceof Element) cb(e.target, e)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }
}
