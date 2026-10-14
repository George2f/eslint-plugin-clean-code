import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    minify: true,
    sourcemap: false,
    target: 'es2022',
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    cjsInterop: true,
    dts: true,
    clean: false,
    minify: true,
    sourcemap: false,
    target: 'es2022',
    splitting: false,
  },
]);
