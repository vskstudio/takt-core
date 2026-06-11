import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
  },
  {
    entry: { takt: 'src/snippet.ts' },
    format: ['iife'],
    minify: true,
    sourcemap: true,
    treeshake: true,
  },
])
