<script>
import marked from 'marked'
import { multiplier } from './store'

export let amountData
export let titleData
let completed = false
let amount

function getAmount () {
	const amountArray = /(\d*\.?\d+)\s(.+)/.exec(amountData)
	if (!amountArray) return amountData

	const toExpand = amountArray[2]
	const expanded_measure = expand(toExpand)
	const didExpand = expanded_measure !== toExpand
	const amount_raw = parseFloat(amountArray[1]) * $multiplier
	const amount_display = prettyify_amount(amount_raw)
	const greaterThanOne = amount_raw > 1
	const addSuffix = greaterThanOne && didExpand
	return `${amount_display} ${expanded_measure}${addSuffix ? 's' : ''}`
}

$: title = titleData.split(' - ')
$: {
	const amountArray = /(\d*\.?\d+)\s(.+)/.exec(amountData)
	if (!amountArray) {
		if (parseFloat(amountData) === amountData) amount = parseFloat(amountData) * $multiplier
		else amount = amountData
	} else {
		const toExpand = amountArray[2]
		const expanded_measure = expand(toExpand)
		const didExpand = expanded_measure !== toExpand
		const amount_raw = parseFloat(amountArray[1]) * $multiplier
		const amount_display = toExpand === 'g' ? amount_raw : prettyify_amount(amount_raw)
		const greaterThanOne = amount_raw > 1
		const addSuffix = greaterThanOne && didExpand
		amount = `${amount_display} ${expanded_measure}${addSuffix ? 's' : ''}`
	}
}
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
function fractionify(decimals) {
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
function prettyify_amount(amount) {
	if (Number.isInteger(amount)) return amount
	let whole_num = Math.floor(amount)
	const remain = amount - whole_num
	whole_num = whole_num == 0 ? '' : whole_num
	return `${whole_num} ${fractionify(remain)}`
}
</script>

<div class="ingredient" class:completed>
	<div class="left">{@html amount }</div>
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
