export interface ClickSource {
  /** Register a handler called with the resolved anchor element and original event.
   *  Returns a disposer function. */
  onAnchorClick(cb: (a: HTMLAnchorElement, e: Event) => void): () => void

  /** Register a handler called with the clicked element and original event.
   *  Returns a disposer function. */
  onElementClick(cb: (target: Element, e: Event) => void): () => void
}
