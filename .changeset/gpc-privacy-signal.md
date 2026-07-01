---
'@vskstudio/takt-core': minor
---

Honor the Global Privacy Control signal (`navigator.globalPrivacyControl`) alongside Do Not Track in the full SDK: when `respectDnt` is on (default), visitors sending GPC are never tracked. The minimal CDN snippet stays within its ≤ 1 kB budget and relies on server-side `Sec-GPC` enforcement (GPC browsers auto-send the header on the beacon).
