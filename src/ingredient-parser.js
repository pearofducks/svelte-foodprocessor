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
    return `<strong>${this.description}</strong> `
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
    if (this.amount.numericDisplay === null) return this.amount.content ?? ''
    const suffix = (this.amount.canSuffix && this.amount.numeric > 1) ? 's' : ''
    return `${this.amount.numericDisplay} ${this.amount.content ?? ''}${suffix}`.trim()
  }
  get data() {
    return {
      'data-raw': this.rawAmount,
      'data-numeric': this.amount.numeric,
      'data-content': this.amount.content,
      'data-can-suffix': this.amount.canSuffix,
      'data-can-pretty': this.amount.canPretty,
    }
  }
  processAmount() {
    const amountArray = /(\d*\.?\d+)\s(.+)/.exec(this.rawAmount)
    if (!amountArray) {
      const numericAmount = parseFloat(this.rawAmount)
      if (numericAmount == this.rawAmount) {
        this.amount.numeric = numericAmount
        this.amount.numericDisplay = this.prettyifyAmount(numericAmount)
        this.amount.content = ''
        this.amount.canPretty = true
      } else {
        this.amount.content = this.rawAmount
      }
    } else {
      const measure = amountArray[2]
      this.amount.numeric = parseFloat(amountArray[1])
      this.amount.canPretty = measure !== 'g'
      this.amount.numericDisplay = this.amount.canPretty ? this.prettyifyAmount(this.amount.numeric) : this.amount.numeric
      this.amount.content = this.expandMeasure(measure)
      this.amount.canSuffix = this.amount.content !== measure
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
  prettyifyAmount(amount) {
    if (Number.isInteger(amount)) return amount
    let whole_num = Math.floor(amount)
    const remain = amount - whole_num
    whole_num = whole_num == 0 ? '' : whole_num
    return `${whole_num} ${this.fractionify(remain)}`
  }
}
