<script>
import marked from 'marked'

export let how

$: howHtml = marked(how)
</script>

<section class="howBlock" aria-labelledby="howLabel">
	<h3 id="howLabel">how</h3>
	<span class="howTextBlock">{@html howHtml}</span>
</section>
