# @takt/core

Tiny privacy-friendly analytics SDK for [Takt](https://github.com/uyangx/takt).

## Snippet (no build)

```html
<script defer src="https://cdn.example/takt.js" data-domain="example.com"></script>
```

Then anywhere: `window.takt('Signup', { props: { plan: 'pro' } })`

## npm

```bash
pnpm add @takt/core
```

```ts
import { init, track } from '@takt/core'
init({ domain: 'example.com' })
track('Signup', { props: { plan: 'pro' }, revenue: { amount: '29.00', currency: 'EUR' } })
```

MIT
