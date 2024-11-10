import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  css: {
    transformer: 'lightningcss',
  },
  build: {
    minify: false,
    target: 'esnext',
    rollupOptions: {
      input: './src/styles.css',
      output: {
        dir: './dist',
        assetFileNames: 'assets/[name].[ext]',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      },
    },
  },
})
