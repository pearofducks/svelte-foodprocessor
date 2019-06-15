<script>
import Ingredient from './Ingredient.svelte'

export let header
export let content
</script>

<div class="ingredientSectionBlock">
  <h4>{header}</h4>
  {#each Object.entries(content) as [k, v]}
	  <Ingredient amountData={v} titleData={k} />
  {/each}
</div>
