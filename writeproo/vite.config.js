import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  esbuild: {
    target: 'esnext',
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      treeshake: false,
    },
  },
})
