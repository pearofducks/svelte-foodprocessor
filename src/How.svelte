<script>
import { marked } from 'marked'

export let how
</script>

<section class="howBlock" aria-labelledby="howLabel">
  <h3 id="howLabel">how</h3>
  <span class="howTextBlock">{@html marked(how.join('\n\n'))}</span>
</section>
