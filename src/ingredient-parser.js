import { marked } from 'marked'

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
  get preparation() {
    return this.splitDescription[1]
  }
  get html() {
    if (!this.rawAmount) return `<span>${this.richDescription}</span>`
    return `<strong>${this.description}</strong>`
      + (this.preparation ? `<em>${this.preparation}</em>` : '')
  }
}

export class Amount {
  constructor(amount) {
    this.rawAmount = amount
    this.amount = { numeric: null, numericDisplay: null, content: null, canSuffix: false, canPretty: false }
    this.processAmount()
  }
  get html() {
    const suffix = (this.amount.canSuffix && this.amount.numeric > 1) ? 's' : ''
    return `${this.amount.numericDisplay} ${this.amount.content}${suffix}`
  }
  get data() {
    return {
      'data-numeric': this.amount.numeric,
      'data-numeric-display': this.amount.numericDisplay,
      'data-content': this.amount.content,
      'data-can-suffix': this.amount.canSuffix,
      'data-can-pretty': this.amount.canPretty,
    }
  }
  processAmount() {
    const amountArray = /(\d*\.?\d+)\s(.+)/.exec(this.rawAmount)
    if (!amountArray) {
      const numericAmount = parseFloat(this.rawAmount)
      if (numericAmount === this.rawAmount) this.amount.numeric = numericAmount
      else this.amount.content = this.rawAmount
    } else {
      const measure = amountArray[2]
      this.amount.numeric = parseFloat(amountArray[1])
      this.amount.canPretty = measure !== 'g'
      this.amount.numericDisplay = this.amount.canPretty ? this.prettyify_amount(this.amount.numeric) : this.amount.numeric
      this.amount.content = this.expandMeasure(measure)
      this.amount.canSuffix = this.amount.content !== measure
      // const greaterThanOne = amountRaw > 1
      // const addSuffix = greaterThanOne && this.amount.canSuffix
    }
  }
  expandMeasure(measure) {
    switch (measure) {
      case 'c': return 'cup'
      case 't': return 'teaspoon'
      case 'T': return 'tablespoon'
      case 'ml': return 'milliliter'
      case 'g': return 'gram'
      default: return measure
    }
  }
  fractionify(decimals) {
    switch (decimals) {
      case 0.125: return '&frac18;'
      case 0.165:
      case 0.166: return '&frac16;'
      case 0.25: return '&frac14;'
      case 0.33: return '&frac13;'
      case 0.375: return '&frac38;'
      case 0.5: return '&frac12;'
      case 0.6:
      case 0.66: return '&frac23;'
      case 0.625: return '&frac58;'
      case 0.75: return '&frac34;'
      case 0.875: return '&frac78;'
      default: return decimals
    }
  }
  prettyify_amount(amount) {
    if (Number.isInteger(amount)) return amount
    let whole_num = Math.floor(amount)
    const remain = amount - whole_num
    whole_num = whole_num == 0 ? '' : whole_num
    return `${whole_num} ${this.fractionify(remain)}`
  }
}
