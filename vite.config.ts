import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'client/index.ts'),
      name: 'LivePulse',
      fileName: (format) => `livepulse.${format}.js`,
      formats: ['iife'],
    },
    outDir: 'build/dist',
    emptyOutDir: true,
    minify: true,
  },
})
