import { marked } from 'marked'
import { parseAmount, formatAmount } from './scale.js'
import { canonicalize } from './density-table.js'

export class Description {
  constructor(amount, description) {
    this.rawAmount = amount
    this.rawDescription = description
  }
  get richDescription() {
    return marked(this.rawDescription)
  }
  get splitDescription() {
    return this.rawDescription.split(' - ')
  }
  get description() {
    return this.splitDescription[0]
  }
  get key() {
    return canonicalize(this.description)
  }
  get preparation() {
    return this.splitDescription[1]
  }
  get html() {
    if (!this.rawAmount) return `<span>${this.richDescription}</span>`
    return `<strong>${this.description}</strong> `
      + (this.preparation ? `<em>${this.preparation}</em>` : '')
  }
}

// Flatten a recipe's `what` (flat map or nested { section: { ... } }) into plain
// "2½ cups flour" strings for JSON-LD recipeIngredient. Mirrors What.svelte's
// nested test (Object(v) === v) and strips markdown from the ingredient name.
export function flattenIngredients(what) {
  const line = (name, amount) => `${new Amount(amount).html} ${String(name).replace(/[*_`]/g, '')}`.trim()
  const out = []
  for (const [k, v] of Object.entries(what ?? {})) {
    if (Object(v) === v) for (const [ik, iv] of Object.entries(v)) out.push(line(ik, iv))
    else out.push(line(k, v))
  }
  return out
}

export class Amount {
  constructor(amount) {
    this.rawAmount = amount
    this.model = parseAmount(amount)
  }
  get html() {
    return formatAmount(this.model, 1)
  }
  get data() {
    const m = this.model
    return {
      'data-raw': this.rawAmount,
      'data-numeric': m.numeric,
      'data-unit': m.unit,
      'data-dim': m.dim,
      'data-content': m.content,
      'data-can-suffix': m.canSuffix,
      'data-can-pretty': m.canPretty,
    }
  }
}
