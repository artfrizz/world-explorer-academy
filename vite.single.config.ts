import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { outDir: 'single-dist', emptyOutDir: true, assetsInlineLimit: 100000000, rollupOptions: { output: { inlineDynamicImports: true } } },
})
