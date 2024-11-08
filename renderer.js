import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import { globSync } from 'glob'
import arg from 'arg'
import path from 'node:path'
import { render } from 'svelte/server'
import { createServer, createViteRuntime } from 'vite'

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

const args = arg({ '--path': String })

function handleRecipes() {
  const basePath = args['--path']
  const recipeLocations = globSync(path.join(basePath, 'recipes/**/*.recipe'), { absolute: true })
  const recipes = recipeLocations.map(handleRecipe).sort((a, b) => a.name.localeCompare(b.name))
  const testRecipe = recipes[0]
  const { body } = render(Recipe, { props: testRecipe })
  writeFileSync('./out/r.html', sanitize(body), 'utf-8')

  const { body: indexContent } = render(Home, { props: { recipes } })
  writeFileSync('./out/index.html', sanitize(indexContent), 'utf-8')
}

function handleRecipe(filename) {
  console.log('Processing', filename)
  const content = readFileSync(filename, 'utf-8')
  const parsed = parseYaml(content)
  return parsed
}

handleRecipes()

vite.close()
