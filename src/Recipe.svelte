<script>
import What from './What.svelte'
import How from './How.svelte'
import Layout from './Layout.svelte'
import { flattenIngredients } from './ingredient-parser.js'

export let name
export let what
export let how

// schema.org Recipe as JSON-LD. Svelte does NOT interpolate inside a <script> tag,
// so we build the string and inject it with {@html}. It lives in the body because
// renderer.js discards render()'s `head` (JSON-LD is valid anywhere in the document).
const recipe = {
  '@context': 'https://schema.org',
  '@type': 'Recipe',
  name,
  recipeIngredient: flattenIngredients(what),
  recipeInstructions: how.map((t) => ({
    '@type': 'HowToStep',
    text: String(t).replace(/[*_`#>]/g, '').trim(),
  })),
}
// Escape < > & so the data can't break out of the <script> tag.
const esc = (s) => s.replace(/[<>&]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
const jsonLd = `<script type="application/ld+json">${esc(JSON.stringify(recipe))}<\/script>`
</script>

<Layout {name}>
  {@html jsonLd}
  <section class="portions">
    <button class="portion" data-portion="0.5">half</button>
    <button class="portion active" data-portion="1">whole</button>
    <button class="portion" data-portion="2">double</button>
  </section>
  <section class="units">
    <button class="unit active" data-mode="volume">volume</button>
    <button class="unit" data-mode="weight">weight</button>
  </section>
  <What {what} />
  <How {how} />
</Layout>
