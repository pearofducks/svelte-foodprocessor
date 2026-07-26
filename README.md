# foodprocessor

Static site generator for a personal recipe collection. It reads `.recipe` (YAML)
files and server-renders Svelte components to plain HTML — no client framework and
no hydration.

## How it works

`renderer.js` boots Vite's SSR runtime, renders each recipe with `svelte/server`,
and writes static files to `./out`:

- `out/<slug>.html` — one page per recipe
- `out/index.html` — the recipe index
- `out/styles.css` — compiled from `src/styles.css` (lightningcss)
- `out/bundle.js` — the progressive-enhancement client (see below)

There is **no `vite build` step**; `vite.config.js` only configures the SSR
transform used by the renderer.

## Recipe format

Recipes live outside this repo (passed via `--path`), in `<path>/recipes/**/*.recipe`:

```yaml
name: banana bread
what:                      # flat map, or nested { section: { … } }
  flour: 2.5 c
  egg: 1
how:                       # array of markdown strings
  - "Heat oven to 350°F / 175°C"
  - "Mix, pour into a greased loaf pan, bake 55–65 min."
```

Amounts are parsed by `src/ingredient-parser.js` and emitted with `data-*`
attributes so the client can rescale them.

## Client interactivity

`src/client.js` is copied verbatim to `out/bundle.js` (it has no imports, so no
bundler is needed) and loaded via a classic `<script defer>`. It progressively
enhances the already-rendered DOM with:

- **portion scaling** — half / whole / double, recomputed from the base
  `data-numeric` values
- **ingredient check-off** — click a row to toggle a completed state (ephemeral)

The page is fully readable with JavaScript disabled.

## Usage

```bash
pnpm install
pnpm run render        # renders ../recipes/**/*.recipe -> ./out
```

Then serve `./out` as static files.
```
