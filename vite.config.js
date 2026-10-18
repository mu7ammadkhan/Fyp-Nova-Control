import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { trimBootstrapCss } from './build/trimBootstrapCss.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: { postcss: { plugins: [trimBootstrapCss()] } },
  build: { manifest: true },
})
