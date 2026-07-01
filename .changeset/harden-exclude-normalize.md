---
'@vskstudio/takt-core': patch
---

Harden `exclude`: normalize entries once (strip trailing slashes, drop empty strings) so `'/app/'` still excludes the bare `/app` and a stray `''` can never blanket-block every path.
