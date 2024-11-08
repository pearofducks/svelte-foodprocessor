<script>
import IngredientSection from './IngredientSection.svelte'
import Ingredient from './Ingredient.svelte'

export let what
</script>

<section class="whatBlock" aria-labelledby="whatLabel">
  <h3 id="whatLabel">what</h3>
  {#each Object.entries(what) as [k, v]}
    {#if Object(v) === v}
      <IngredientSection header={k} content={v} />
    {:else}
      <Ingredient _amount={v} _description={k} />
    {/if}
  {/each}
</section>
