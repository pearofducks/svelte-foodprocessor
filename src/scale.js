// Pure, isomorphic amount parsing / scaling / formatting.
// No DOM, no `marked`. Imported by the SSR components (via ingredient-parser.js)
// AND bundled into the client, so amounts render identically on both sides.

// Nice fractions as unicode glyphs (same codepoints the browser resolves the old
// &fracXY; entities to). value -> nearest glyph within `eps`, else a short decimal.
const GLYPHS = [
  [1 / 8, '\u215B'],
  [1 / 6, '\u2159'],
  [1 / 4, '\u00BC'],
  [1 / 3, '\u2153'],
  [3 / 8, '\u215C'],
  [1 / 2, '\u00BD'],
  [5 / 8, '\u215D'],
  [2 / 3, '\u2154'],
  [3 / 4, '\u00BE'],
  [7 / 8, '\u215E'],
]

// Canonical units. `ml`/`g` are the per-dimension base quantities.
export const UNITS = {
  t: { dim: 'volume', ml: 4.92892, name: 'teaspoon' },
  T: { dim: 'volume', ml: 14.78676, name: 'tablespoon' },
  c: { dim: 'volume', ml: 236.5882, name: 'cup' },
  ml: { dim: 'volume', ml: 1, name: 'milliliter' },
  dl: { dim: 'volume', ml: 100, name: 'deciliter' },
  g: { dim: 'mass', g: 1, name: 'gram' },
  oz: { dim: 'mass', g: 28.3495, name: 'ounce' },
  lb: { dim: 'mass', g: 453.592, name: 'pound' },
}

// Raw token (the text after the number) -> canonical unit symbol.
const ALIASES = {
  t: 't', tsp: 't', teaspoon: 't', teaspoons: 't',
  T: 'T', tbsp: 'T', tablespoon: 'T', tablespoons: 'T',
  c: 'c', cup: 'c', cups: 'c',
  ml: 'ml', dl: 'dl',
  g: 'g', gram: 'g', grams: 'g',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
}

// Only these expand to a spelled-out, pluralizable word (matches historical output);
// any other token (oz, lb, dl, cloves, "to 8 oz", ...) is displayed verbatim.
const EXPAND = { c: 'cup', t: 'teaspoon', T: 'tablespoon', ml: 'milliliter', g: 'gram' }

// Curated singular <-> plural for freeform count nouns (not known measures).
const COUNT_NOUNS = {
  clove: 'cloves', can: 'cans', stick: 'sticks', slice: 'slices',
  lemon: 'lemons', lime: 'limes', leaf: 'leaves', package: 'packages',
  pound: 'pounds', dash: 'dashes', pinch: 'pinches',
}
const toSingular = Object.fromEntries(
  Object.entries(COUNT_NOUNS).map(([s, p]) => [p, s]),
)

const round2 = (n) => Math.round(n * 100) / 100

export function prettify(n, eps = 0.03) {
  const whole = Math.floor(n)
  const rem = n - whole
  if (rem < eps) return String(whole)
  const hit = GLYPHS.find(([v]) => Math.abs(rem - v) < eps)
  return hit ? `${whole || ''}${hit[1]}` : String(round2(n))
}

// Parse a raw amount (string or number) into a display-agnostic model.
export function parseAmount(raw) {
  const s = String(raw ?? '').trim()
  const m = /^(\d*\.?\d+)\s+(.+)$/.exec(s)
  if (!m) {
    const n = parseFloat(s)
    if (String(n) === s) {
      // bare count, e.g. `eggs: 2`
      return { numeric: n, unit: null, dim: 'count', content: '', canPretty: true, canSuffix: false }
    }
    // non-numeric ("a pinch") or empty ("!")
    return { numeric: null, unit: null, dim: null, content: s, canPretty: false, canSuffix: false }
  }
  const numeric = parseFloat(m[1])
  const token = m[2]
  const unit = ALIASES[token] || null
  const content = EXPAND[unit] || token
  return {
    numeric,
    unit,
    dim: unit ? UNITS[unit].dim : null,
    content,
    canPretty: token !== 'g',
    canSuffix: content !== token,
  }
}

// Volume-US normalization: step DOWN out of an awkwardly-small fraction of a unit
// into the next-smaller unit (fractional tablespoons -> teaspoons, sub-1/4 cups ->
// tablespoons). So 1 T halved -> 1.5 t and 1/8 cup -> 2 T, while comfortable values
// stay in their authored unit (1/2 cup, 3.5 tsp, 6 T, 0.3 cup all unchanged).
// We intentionally do NOT combine upward (3 tsp stays "3 teaspoons", not "1 T"):
// promoting produces awkward results like 3.5 tsp -> "1 1/6 T" or 6 T -> "3/8 cup".
const DOWN = { c: 'T', T: 't' }
const MINS = { c: 0.25, T: 1, t: 0 }

export function normalize(value, unit) {
  if (unit !== 'c' && unit !== 'T' && unit !== 't') {
    return { value, unit, name: unit ? UNITS[unit].name : null }
  }
  let v = value
  let u = unit
  while (v < MINS[u] && DOWN[u]) {
    v *= UNITS[u].ml / UNITS[DOWN[u]].ml
    u = DOWN[u]
  }
  return { value: v, unit: u, name: UNITS[u].name }
}

// Turn a model + multiplier into the final display string.
export function formatAmount(model, mult = 1) {
  const { numeric, unit, content, canPretty, canSuffix } = model
  if (numeric == null) return content ?? ''

  let value = numeric * mult
  let name = content
  let pretty = canPretty
  let suffix = canSuffix

  if (unit === 'c' || unit === 'T' || unit === 't') {
    const norm = normalize(value, unit)
    value = norm.value
    name = norm.name
    pretty = true
    suffix = true // normalized names are known measures -> pluralize with `s`
  }

  const num = pretty ? prettify(value) : String(round2(value))
  let word = name
  if (suffix) {
    if (value > 1) word = `${name}s`
  } else if (value === 1 && toSingular[name]) {
    word = toSingular[name]
  } else if (value > 1 && COUNT_NOUNS[name]) {
    word = COUNT_NOUNS[name]
  }
  return `${num} ${word}`.trim()
}
