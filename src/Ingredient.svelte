<script>
import { Amount, Description } from './ingredient-parser.js'

export let _amount
export let _description

const amount = new Amount(_amount)
const description = new Description(_amount, _description)
</script>

<div class="ingredient">
  <div class="left" {...amount.data} data-key={description.key}>{@html amount.html}</div>
  <div class="right">
    {@html description.html}
  </div>
</div>
