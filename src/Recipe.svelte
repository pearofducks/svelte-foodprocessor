<script>
import What from './What.svelte'
import How from './How.svelte'
import Layout from './Layout.svelte'

export let name
export let what
export let how
</script>

<Layout {name}>
  <section class="portions">
    <button class="portion" data-portion="0.5">half</button>
    <button class="portion active" data-portion="1">whole</button>
    <button class="portion" data-portion="2">double</button>
  </section>
  <What {what} />
  <How {how} />
</Layout>
