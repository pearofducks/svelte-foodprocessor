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

`vite.config.js` only configures the SSR transform used by the renderer; the client
bundle is produced by a one-shot `vite build()` call inside `renderer.js`.

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

Amounts are parsed and formatted by `src/scale.js` (units, fractions, portion
scaling, unit normalization) and emitted on each ingredient as `data-*` attributes
so the client can recompute them. `src/density-table.js` maps ingredient names to
densities for the volume→weight toggle. Both are pure/isomorphic — used at render
time and bundled into the client — and covered by `test/`.

## Client interactivity

`src/client.js` (bundled with its `scale.js` / `density-table.js` imports into
`out/bundle.js`) loads via a classic `<script defer>` and progressively enhances
the already-rendered DOM — no hydration. Interactions:

- **portion scaling** — half / whole / double, recomputed from each amount's
  immutable base value, with unit normalization (e.g. ½ tablespoon → 1½ teaspoons)
- **volume → weight** — toggle known volume amounts to grams via the density table
  (auto-hidden when a recipe has nothing convertible)
- **ingredient check-off** — click a row to toggle a completed state (ephemeral)

The page is fully readable and correct with JavaScript disabled.

## Usage

```bash
pnpm install
pnpm run render        # renders ../recipes/**/*.recipe -> ./out
pnpm test              # unit tests for the pure scale / density modules
```

Then serve `./out` as static files.
