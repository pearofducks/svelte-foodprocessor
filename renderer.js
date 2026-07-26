import { readFileSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import { globSync } from 'glob'
import arg from 'arg'
import path from 'node:path'
import { createServer, createServerModuleRunner, build } from 'vite'
import { slugify } from './src/util.js'

mkdirSync('./out', { recursive: true })
const sanitize = str => str.replaceAll(/<!--(.|\s)*?-->/g, '')

const vite = await createServer({
  configFile: './vite.config.js',
  appType: 'custom',
  // One-shot render: no watcher/HMR needed (writing to ./out under the root would
  // otherwise trip the watcher and spam "[vite] program reload").
  server: { middlewareMode: true, watch: null, hmr: false },
})
const runner = createServerModuleRunner(vite.environments.ssr)
// Import `render` through the runner too, so it shares the exact Svelte instance
// used by the compiled components (avoids a dual-instance null dev context).
const { render } = await runner.import('svelte/server')
const Recipe = (await runner.import('/src/Recipe.svelte')).default
const Home = (await runner.import('/src/Home.svelte')).default
const css = (await runner.import('/src/styles.css?inline')).default
const htmlTemplate = readFileSync('./public/index.html', 'utf-8')
const useTemplate = (str) => htmlTemplate.replace('<!-- CONTENT -->', str)

const args = arg({ '--path': String })

function handleRecipes() {
  const basePath = args['--path']
  const recipeLocations = globSync(path.join(basePath, 'recipes/**/*.recipe'), { absolute: true })
  const recipes = recipeLocations.map(handleRecipe).sort((a, b) => a.name.localeCompare(b.name))
  recipes.forEach(r => {
    const { body } = render(Recipe, { props: r })
    const html = useTemplate(sanitize(body))
    writeFileSync(`./out/${slugify(r.name)}.html`, html, 'utf-8')
  })
  const { body: indexContent } = render(Home, { props: { recipes } })
  writeFileSync('./out/index.html', useTemplate(sanitize(indexContent)), 'utf-8')
  writeFileSync('./out/styles.css', css, 'utf-8')
  // public/index.html is the render template, not a static asset; copyPublicDir is
  // off (below) so it can't clobber the rendered index.html. Copy the real asset.
  copyFileSync('./public/favicon.ico', './out/favicon.ico')
}

function handleRecipe(filename) {
  console.log('Processing', filename)
  const content = readFileSync(filename, 'utf-8')
  const parsed = parseYaml(content)
  return parsed
}

try {
  handleRecipes()
  // Bundle the progressive-enhancement client (inlines ./scale.js) into a single
  // IIFE at out/bundle.js, loaded via the classic <script src='bundle.js'> tag.
  await build({
    configFile: false, // plain JS bundle; skip the svelte/lightningcss app config
    logLevel: 'warn',
    build: {
      minify: true, // Vite 8: Oxc minifier
      target: 'es2020',
      emptyOutDir: false,
      copyPublicDir: false, // else public/index.html (the template) overwrites the rendered one
      rolldownOptions: {
        input: './src/client.js',
        output: {
          dir: './out',
          format: 'iife',
          entryFileNames: 'bundle.js',
        },
      },
    },
  })
} finally {
  vite.close()
}
