<script>
import IngredientSection from './IngredientSection.svelte'
import Ingredient from './Ingredient.svelte'
import How from './How.svelte'
import { multiplier } from './store'

export let recipe

$: what = recipe.what
$: how = recipe.how
</script>

<section>
	<button class="portion" class:activePortion="{$multiplier === 0.5}" on:click={() => $multiplier = 0.5}>half</button>
	<button class="portion" class:activePortion="{$multiplier === 1}" on:click={() => $multiplier = 1}>whole</button>
</section>
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
<How {how} />
