<script>
import page from 'page'
import { recipes } from './store'
import Home from './Home.svelte'
import Recipe from './Recipe.svelte'

let slug = ''

page('/', (e) => { slug = null })
page('/:slug', ({ params }) => { slug = params.slug })
page()

$: recipe = recipes[slug] || {}
$: document.title = 'h|f - ' + (recipe.name || 'recipes')
</script>

<nav class="header">
	<h1>
		<a href="/">honneffer | food</a>
	</h1>
	<h2>{ recipe.name || '' }</h2>
</nav>

{#if !slug }
	<Home {recipes} />
{:else}
	<Recipe {recipe} />
{/if}
