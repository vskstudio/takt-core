import type { ClickSource } from '../ports/ClickSource'
import type { TrackOptions } from '../Analytics'
import { readTaggedEvent } from '../../domain/event/tagged'

export class TaggedEventTracker {
  constructor(
    private readonly clickSource: ClickSource,
    private readonly track: (name: string, opts?: TrackOptions) => void,
  ) {}

  enable(): () => void {
    return this.clickSource.onElementClick((target) => {
      const ev = readTaggedEvent(target)
      if (ev) this.track(ev.name, ev.props ? { props: ev.props } : undefined)
    })
  }
}
