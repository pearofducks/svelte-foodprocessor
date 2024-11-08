<script>
import { slugify } from './util.js'

export let recipes
</script>

<ul class="recipe-list">
  {#each recipes as r}
    <li>
      <h2><a href={slugify(r.name)}>{r.name}</a></h2>
    </li>
  {:else}
    <li>No recipes, something is broke :(</li>
  {/each}
</ul>
