import { itsy } from '@itsy/lint'

export default [
  { ignores: ['out/', 'dist/'] }, // build output, not source
  ...await itsy({ modules: ['js', 'svelte'] }),
  {
    // Trusted static-site rendering: {@html} only emits build-time output from our
    // own recipe files (marked / Amount), never user input.
    rules: {
      'svelte/no-at-html-tags': 'off',
    },
  },
]
