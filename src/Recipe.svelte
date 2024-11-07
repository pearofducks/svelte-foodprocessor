<script>
import What from './What.svelte'
import How from './How.svelte'

export let what
export let how
</script>

<section>
  <button class="portion" data-portion="half">half</button>
  <button class="portion" data-portion="whole">whole</button>
</section>
<What {what} />
<How {how} />
