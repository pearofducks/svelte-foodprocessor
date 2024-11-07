import { marked } from 'marked';

const ELEMENT_IS_NAMESPACED = 1;
const ELEMENT_PRESERVE_ATTRIBUTE_CASE = 1 << 1;

/**
 * Attributes that are boolean, i.e. they are present or not present.
 */
const DOM_BOOLEAN_ATTRIBUTES = [
	'allowfullscreen',
	'async',
	'autofocus',
	'autoplay',
	'checked',
	'controls',
	'default',
	'disabled',
	'formnovalidate',
	'hidden',
	'indeterminate',
	'ismap',
	'loop',
	'multiple',
	'muted',
	'nomodule',
	'novalidate',
	'open',
	'playsinline',
	'readonly',
	'required',
	'reversed',
	'seamless',
	'selected',
	'webkitdirectory'
];

/**
 * Returns `true` if `name` is a boolean attribute
 * @param {string} name
 */
function is_boolean_attribute(name) {
	return DOM_BOOLEAN_ATTRIBUTES.includes(name);
}

const ATTR_REGEX = /[&"<]/g;
const CONTENT_REGEX = /[&<]/g;

/**
 * @template V
 * @param {V} value
 * @param {boolean} [is_attr]
 */
function escape_html(value, is_attr) {
	const str = String(value ?? '');

	const pattern = is_attr ? ATTR_REGEX : CONTENT_REGEX;
	pattern.lastIndex = 0;

	let escaped = '';
	let last = 0;

	while (pattern.test(str)) {
		const i = pattern.lastIndex - 1;
		const ch = str[i];
		escaped += str.substring(last, i) + (ch === '&' ? '&amp;' : ch === '"' ? '&quot;' : '&lt;');
		last = i + 1;
	}

	return escaped + str.substring(last);
}

/** @import { Component } from '#server' */

/** @type {Component | null} */
var current_component = null;

/**
 * @param {Function} [fn]
 */
function push(fn) {
	current_component = { p: current_component, c: null, d: null };
}

function pop() {
	var component = /** @type {Component} */ (current_component);

	var ondestroy = component.d;

	if (ondestroy) {
		on_destroy.push(...ondestroy);
	}

	current_component = component.p;
}

/**
 * @param {string} value
 */
function html(value) {
	var html = String(value ?? '');
	var open = '<!---->';
	return open + html + '<!---->';
}

/** @import { ComponentType, SvelteComponent } from 'svelte' */
/** @import { Component, Payload, RenderOutput } from '#server' */
/** @import { Store } from '#shared' */

// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
// https://infra.spec.whatwg.org/#noncharacter
const INVALID_ATTR_NAME_CHAR_REGEX =
	/[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;

/**
 * Array of `onDestroy` callbacks that should be called at the end of the server render function
 * @type {Function[]}
 */
let on_destroy = [];

/**
 * `<div translate={false}>` should be rendered as `<div translate="no">` and _not_
 * `<div translate="false">`, which is equivalent to `<div translate="yes">`. There
 * may be other odd cases that need to be added to this list in future
 * @type {Record<string, Map<any, string>>}
 */
const replacements = {
	translate: new Map([
		[true, 'yes'],
		[false, 'no']
	])
};

/**
 * @template V
 * @param {string} name
 * @param {V} value
 * @param {boolean} [is_boolean]
 * @returns {string}
 */
function attr(name, value, is_boolean = false) {
	if (value == null || (!value && is_boolean) || (value === '' && name === 'class')) return '';
	const normalized = (name in replacements && replacements[name].get(value)) || value;
	const assignment = is_boolean ? '' : `="${escape_html(normalized, true)}"`;
	return ` ${name}${assignment}`;
}

/**
 * @param {Record<string, unknown>} attrs
 * @param {Record<string, string>} [classes]
 * @param {Record<string, string>} [styles]
 * @param {number} [flags]
 * @returns {string}
 */
function spread_attributes(attrs, classes, styles, flags = 0) {

	let attr_str = '';
	let name;

	const is_html = (flags & ELEMENT_IS_NAMESPACED) === 0;
	const lowercase = (flags & ELEMENT_PRESERVE_ATTRIBUTE_CASE) === 0;

	for (name in attrs) {
		// omit functions, internal svelte properties and invalid attribute names
		if (typeof attrs[name] === 'function') continue;
		if (name[0] === '$' && name[1] === '$') continue; // faster than name.startsWith('$$')
		if (INVALID_ATTR_NAME_CHAR_REGEX.test(name)) continue;

		if (lowercase) {
			name = name.toLowerCase();
		}

		attr_str += attr(name, attrs[name], is_html && is_boolean_attribute(name));
	}

	return attr_str;
}

/**
 * Legacy mode: If the prop has a fallback and is bound in the
 * parent component, propagate the fallback value upwards.
 * @param {Record<string, unknown>} props_parent
 * @param {Record<string, unknown>} props_now
 */
function bind_props(props_parent, props_now) {
	for (const key in props_now) {
		const initial_value = props_parent[key];
		const value = props_now[key];
		if (
			initial_value === undefined &&
			value !== undefined &&
			Object.getOwnPropertyDescriptor(props_parent, key)?.set
		) {
			props_parent[key] = value;
		}
	}
}

class Description {
  constructor(amount, description) {
    this.rawAmount = amount;
    this.rawDescription = description;
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

class Amount {
  constructor(amount) {
    this.rawAmount = amount;
    this.amount = { numeric: null, numericDisplay: null, content: null, canSuffix: false, canPretty: false };
    this.processAmount();
  }
  get html() {
    return 'foo'
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
    const amountArray = /(\d*\.?\d+)\s(.+)/.exec(this.rawAmount);
    if (!amountArray) {
      const numericAmount = parseFloat(this.rawAmount);
      if (numericAmount === this.rawAmount) this.amount.numeric = numericAmount;
      else this.amount.content = this.rawAmount;
    } else {
      const measure = amountArray[2];
      this.amount.numeric = parseFloat(amountArray[1]);
      this.amount.canPretty = measure !== 'g';
      this.amount.numericDisplay = this.amount.canPretty ? this.prettyify_amount(this.amount.numeric) : this.amount.numeric;
      this.amount.content = this.expandMeasure(measure);
      this.amount.canSuffix = this.amount.content !== measure;
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
    let whole_num = Math.floor(amount);
    const remain = amount - whole_num;
    whole_num = whole_num == 0 ? '' : whole_num;
    return `${whole_num} ${this.fractionify(remain)}`
  }
}

function Ingredient($$payload, $$props) {
	push();

	let ingredient = $$props["ingredient"];
	const [_description, _amount] = Object.entries(ingredient).at(0);
	const amount = new Amount(_amount);
	const description = new Description(_amount, _description);

	$$payload.out += `<div class="ingredient"><div${spread_attributes({ class: "left", ...amount.data })}>${escape_html(amount.html)}</div> <button class="right">${html(description.html)}</button></div>`;
	bind_props($$props, { ingredient });
	pop();
}

export { Ingredient as ingredient };
