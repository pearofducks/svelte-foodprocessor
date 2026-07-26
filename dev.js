// Live dev server. Long-lived Vite dev server + on-demand SSR: each request renders
// only the viewed page (sub-second, incremental), and any source or recipe change
// triggers a browser reload via Vite's own client. No separate build step.
//
//   node dev.js --path '..' [--port 5173]
import { readFileSync } from 'node:fs'
import { createServer as createHttpServer } from 'node:http'
import path from 'node:path'
import arg from 'arg'
import { parse as parseYaml } from 'yaml'
import { globSync } from 'glob'
import { createServer, createServerModuleRunner } from 'vite'
import { slugify } from './src/util.js'

const args = arg({ '--path': String, '--port': Number })
const basePath = args['--path'] ?? '..'
const PORT = args['--port'] ?? 5173

const vite = await createServer({
  configFile: './vite.config.js',
  appType: 'custom',
  // Keep the watcher (drives module invalidation + reloads) but ignore build output
  // so writing to ./out never trips it.
  server: { middlewareMode: true, watch: { ignored: ['**/out/**', '**/dist/**'] } },
})
const runner = createServerModuleRunner(vite.environments.ssr)
const htmlTemplate = readFileSync('./public/index.html', 'utf-8')
const recipesGlob = path.join(basePath, 'recipes/**/*.recipe')

const loadRecipes = () => globSync(recipesGlob, { absolute: true })
  .map((f) => parseYaml(readFileSync(f, 'utf-8')))
  .sort((a, b) => a.name.localeCompare(b.name))

async function renderPage(url) {
  // Imported through the runner so `render` shares the components' Svelte instance,
  // and re-imported per request so edits are picked up (cached until invalidated).
  const { render } = await runner.import('svelte/server')
  const recipes = loadRecipes()
  const slug = url.replace(/^\//, '').replace(/\.html$/, '')

  let body
  if (!slug) {
    const Home = (await runner.import('/src/Home.svelte')).default
    body = render(Home, { props: { recipes } }).body
  } else {
    const recipe = recipes.find((r) => slugify(r.name) === slug)
    if (!recipe) return null
    const Recipe = (await runner.import('/src/Recipe.svelte')).default
    body = render(Recipe, { props: recipe }).body
  }

  const html = htmlTemplate
    .replace('<!-- CONTENT -->', body)
    // Dev: let Vite serve CSS + client modules (with HMR / transformed imports)
    // instead of the built styles.css / bundle.js.
    .replace("<link rel='stylesheet' href='styles.css'>", '<script type="module">import "/src/styles.css"</script>')
    .replace(
      "<script src='bundle.js' defer></script>",
      '<script type="module" src="/@vite/client"></script>\n'
        + '  <script type="module" src="/src/client.js"></script>',
    )
  return vite.transformIndexHtml(url, html)
}

const server = createHttpServer((req, res) => {
  vite.middlewares(req, res, async () => {
    const url = (req.url || '/').split('?')[0]
    if (url === '/favicon.ico') { res.statusCode = 204; res.end(); return }
    try {
      const html = await renderPage(url)
      if (html == null) { res.statusCode = 404; res.end('Not found'); return }
      res.setHeader('Content-Type', 'text/html')
      res.end(html)
    } catch (e) {
      vite.ssrFixStacktrace?.(e)
      res.statusCode = 500
      res.end(String(e?.stack || e))
    }
  })
})

// SSR pages aren't in Vite's client module graph, so reload the browser ourselves
// on any source or recipe change. (Recipes live outside the root -> add them.)
vite.watcher.add(path.resolve(basePath, 'recipes'))
const reload = () => vite.ws.send({ type: 'full-reload' })
for (const ev of ['change', 'add', 'unlink']) vite.watcher.on(ev, reload)

server.listen(PORT, () => console.log(`dev server: http://localhost:${PORT}`))
