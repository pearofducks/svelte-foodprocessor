import { readFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import { globSync } from 'glob'
import arg from 'arg'
import path from 'node:path'
import { render } from 'svelte/server'
import { createServer, createViteRuntime } from 'vite'
const vite = await createServer({
  configFile: './vite.config.js',
  appType: 'custom',
  server: { middlewareMode: true },
})
const ssr = await createViteRuntime(vite)
const Ingredient = (await ssr.executeEntrypoint('./src/Ingredient.svelte')).default

const args = arg({ '--path': String })

function handleRecipes() {
  const basePath = args['--path']
  const recipes = globSync(path.join(basePath, 'recipes/**/*.recipe'), { absolute: true })
  const payload = { out: '' }
  const { html } = render(Ingredient, { props: { ingredient: { 'carrots - sliced': '1 c' } } })
  console.log(html.replaceAll(/<!--(.|\s)*?-->/g, ''))
}

function handleRecipe(filename) {
  const content = readFileSync(filename, 'utf-8')
  const parsed = parseYaml(content)
  console.log(parsed)
  return parsed
}

handleRecipes()

vite.close()
// handleRecipe('chili.recipe')
