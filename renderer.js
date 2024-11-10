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
const Ingredient = (await ssr.executeEntrypoint('./src/Ingredient.svelte')).default
const css = (await ssr.executeEntrypoint('./src/styles.css')).default
const htmlTemplate = readFileSync('./public/index.html', 'utf-8')
const useTemplate = (str) => htmlTemplate.replace('<!-- CONTENT -->', str)

const args = arg({ '--path': String })

function handleRecipes() {
  // const t = { 'lemons - halved': '4' }
  // const { body } = render(Ingredient, { props: { _amount: '4', _description: 'lemons - halved' } })
  // console.log({ body })
  // return
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

handleRecipes()

vite.close()
