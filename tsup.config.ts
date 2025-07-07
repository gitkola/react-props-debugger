import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  loader: {
    '.tsx': 'tsx',
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  banner: {
    js: '/* React Props Debugger - Development Tool */',
  },
});
