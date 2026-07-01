import type { EnvironmentProvider } from '../../application/ports/EnvironmentProvider'

export class WindowEnvironmentProvider implements EnvironmentProvider {
  hostname(): string { return location.hostname }
  path(): string { return location.pathname }
  url(): string { return location.href }
  referrer(): string { return document.referrer }
  width(): number { return window.innerWidth || 0 }
}
