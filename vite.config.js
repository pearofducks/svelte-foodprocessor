import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// Used by renderer.js (createServer) for the Svelte SSR transform + lightningcss.
// There is no `vite build` step; renderer.js writes the static site to ./out.
export default defineConfig({
  plugins: [svelte()],
  css: {
    transformer: 'lightningcss',
  },
})
