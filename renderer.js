import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import { globSync } from 'glob'
import arg from 'arg'
import path from 'node:path'
import { render } from 'svelte/server'
import { createServer, createViteRuntime } from 'vite'
import { slugify } from './src/util.js'

mkdirSync('./out', { recursive: true })
const sanitize = str => str.replaceAll(/<!--(.|\s)*?-->/g, '')

const vite = await createServer({
  configFile: './vite.config.js',
  appType: 'custom',
  server: { middlewareMode: true },
})
const ssr = await createViteRuntime(vite)
const Recipe = (await ssr.executeEntrypoint('./src/Recipe.svelte')).default
const Home = (await ssr.executeEntrypoint('./src/Home.svelte')).default
const css = (await ssr.executeEntrypoint('./src/styles.css')).default
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
}

function handleRecipe(filename) {
  console.log('Processing', filename)
  const content = readFileSync(filename, 'utf-8')
  const parsed = parseYaml(content)
  return parsed
}

try {
  handleRecipes()
  // Ship the progressive-enhancement client. No bundler: it has no imports, and
  // the page loads it via the classic <script src='bundle.js'> in the template.
  writeFileSync('./out/bundle.js', readFileSync('./src/client.js', 'utf-8'))
} finally {
  vite.close()
}
