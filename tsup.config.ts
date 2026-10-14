import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    target: 'es2022',
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    cjsInterop: true,
    clean: false,
    sourcemap: true,
    target: 'es2022',
    splitting: false,
  },
]);
