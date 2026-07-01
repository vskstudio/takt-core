export interface EnvironmentProvider {
  hostname(): string
  path(): string
  url(): string
  referrer(): string
  width(): number
}
