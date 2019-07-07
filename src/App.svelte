<script>
import page from 'page'
import { recipes } from './store'
import Home from './Home.svelte'
import Recipe from './Recipe.svelte'

let slug

const scrollToTop = () => window.scroll(0,0)

page('/', (_, next) => (slug = null, next()), scrollToTop)
page('/:slug', ({ params }, next) => (slug = params.slug, next()), scrollToTop)
page()

$: recipe = recipes[slug] || {}
$: {
	document.title = 'h|f - ' + (recipe.name || 'recipes')
}
</script>

<main class="container">
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
</main>