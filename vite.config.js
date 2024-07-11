import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        noapi: './src/index.ts',
      },
      formats: ['cjs'],
    },
  },
});
