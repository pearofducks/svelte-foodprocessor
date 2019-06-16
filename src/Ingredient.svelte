<script>
import marked from 'marked'

export let amountData
export let titleData
let completed = false

function getAmount () {
	const amountArray = /(\d*\.?\d+)\s(.+)/.exec(amountData)
	if (!amountArray) return amountData

	const toExpand = amountArray[2]
	const expanded_measure = expand(toExpand)
	const didExpand = expanded_measure !== toExpand
	const amount_raw = parseFloat(amountArray[1])
	const amount_display = prettyify_amount(amount_raw)
	const greaterThanOne = amount_raw > 1
	const addSuffix = greaterThanOne && didExpand
	return `${amount_display} ${expanded_measure}${addSuffix ? 's' : ''}`
}

$: title = titleData.split(' - ')
$: amount = getAmount() || ''
function markupTitle() {
	return marked(titleData)
}
function toggleCompleted() {
  completed = !completed
}
function expand(measure) {
	switch (measure) {
		case 'c': return 'cup'
		case 't': return 'teaspoon'
		case 'T': return 'tablespoon'
		case 'ml': return 'milliliter'
		case 'g': return 'gram'
		default: return measure
	}
}
function prettyify_amount(amount) {
	if (Number.isInteger(amount)) return amount
		let whole_num = Math.floor(amount)
	const remain = amount - whole_num
	whole_num = whole_num == 0 ? '' : whole_num
	switch (remain) {
		case 0.25:
		return `${whole_num} ¼`
		case 0.33:
		return `${whole_num} ⅓`
		case 0.5:
		return `${whole_num} ½`
		case 0.6:
		case 0.66:
		return `${whole_num} ⅔`
		case 0.75:
		return `${whole_num} ¾`
		default:
		return amount
	}
}
</script>

<div class="ingredient" class:completed>
	<div class="left">{ amount }</div>
	<div class="right" on:click={ toggleCompleted }>
		{#if !amountData}
			<span>{@html markupTitle()}</span>
		{:else}
			<strong>{ title[0] }</strong>
			{#if title.length == 2}
				<em>{ title[1] }</em>
			{/if}
		{/if}
	</div>
</div>
