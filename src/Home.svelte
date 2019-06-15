<script>
export let recipes
</script>

<ul>
  {#each Object.entries(recipes) as [slug, r]}
    <li><h2><a href={slug}>{ r.name }</a></h2></li>
  {:else}
    <li>No recipes, something is broke :(</li>
  {/each}
</ul>
