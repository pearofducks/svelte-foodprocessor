<script>
import What from './What.svelte'
import How from './How.svelte'
import Layout from './Layout.svelte'

export let name
export let what
export let how
</script>

<Layout {name}>
  <section>
    <button class="portion" data-portion="half">half</button>
    <button class="portion" data-portion="whole">whole</button>
  </section>
  <What {what} />
  <How {how} />
</Layout>
