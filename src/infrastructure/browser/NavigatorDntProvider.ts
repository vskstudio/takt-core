import type { DoNotTrackProvider } from '../../application/ports/DoNotTrackProvider'

// Honors both browser opt-out signals: Do Not Track (navigator.doNotTrack,
// incl. legacy 'yes' from old Firefox/Safari) and Global Privacy Control
// (navigator.globalPrivacyControl), the legally enforceable CCPA/CPRA signal.
export class NavigatorDntProvider implements DoNotTrackProvider {
  isEnabled(): boolean {
    const v = navigator.doNotTrack
    if (v === '1' || v === 'yes') return true
    return (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  }
}
