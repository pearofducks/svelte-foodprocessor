<script>
import IngredientSection from './IngredientSection.svelte'
import Ingredient from './Ingredient.svelte'


export let recipe

$: what = recipe.what
$: how = recipe.how
</script>

<section class="whatBlock" aria-labelledby="whatLabel">
	<h3 id="whatLabel">what</h3>
  {#each Object.entries(what) as [k, v]}
	  {#if Object(v) === v}
			<IngredientSection header={k} content={v} />
	  {:else}
			<Ingredient amountData={v} titleData={k} />
	  {/if}
	{/each}
</section>
<section class="howBlock" aria-labelledby="howLabel">
	<h3 id="howLabel">how</h3>
	<span class="howTextBlock" v-html="how"/>
</section>
