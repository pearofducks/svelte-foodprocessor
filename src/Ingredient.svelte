<script>
import { Amount, Description } from './ingredient-parser.js'

export let ingredient
const [_description, _amount] = Object.entries(ingredient).at(0)

const amount = new Amount(_amount)
const description = new Description(_amount, _description)
</script>

<div class="ingredient">
  <div class="left" {...amount.data}>{amount.html}</div>
  <button class="right">
    {@html description.html}
  </button>
</div>
