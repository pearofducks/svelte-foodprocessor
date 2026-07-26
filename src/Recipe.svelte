<script>
import What from './What.svelte'
import How from './How.svelte'
import Layout from './Layout.svelte'

export let name
export let what
export let how
</script>

<Layout {name}>
  <script type="application/ld+json">
    {JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name,
    ingredients: what,
    instructions: how,
    })}
  </script>
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
