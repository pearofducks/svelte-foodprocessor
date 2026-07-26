// Ingredient densities for the optional cup->weight toggle (Phase 3).
// Pure, isomorphic: canonicalize() runs at SSR (to emit data-key), toGrams() runs
// on the client. Coverage is best-effort — unknown ingredients simply don't convert.
import { UNITS } from './scale.js'

// Grams per US cup. Approximate, hand-curated; tweak to taste.
export const DENSITY = {
  flour: 120,
  sugar: 200,
  'brown sugar': 213,
  'powdered sugar': 113,
  butter: 227,
  milk: 240,
  water: 236,
  oil: 218,
  honey: 340,
  'maple syrup': 320,
  'corn syrup': 328,
  molasses: 340,
  oats: 90,
  cornmeal: 150,
  cocoa: 85,
  cornstarch: 120,
  'sour cream': 240,
  buttermilk: 240,
  cream: 240,
  yogurt: 245,
  rice: 185,
  nuts: 120,
  almonds: 140,
  'chocolate chips': 170,
  coconut: 80,
  raisins: 150,
  'peanut butter': 270,
  'cream cheese': 230,
  parmesan: 100,
  'bread crumbs': 108,
  salt: 273,
}

// Variant/brand names -> a canonical DENSITY key.
const ALIASES = {
  'all purpose flour': 'flour', 'ap flour': 'flour', 'bread flour': 'flour',
  'whole wheat flour': 'flour', 'plain flour': 'flour', 'cake flour': 'flour',
  'granulated sugar': 'sugar', 'white sugar': 'sugar', 'cane sugar': 'sugar',
  'caster sugar': 'sugar', 'vanilla sugar': 'sugar', 'sanding sugar': 'sugar',
  'packed brown sugar': 'brown sugar',
  'confectioners sugar': 'powdered sugar', 'icing sugar': 'powdered sugar',
  'vegetable oil': 'oil', 'olive oil': 'oil', 'canola oil': 'oil', 'peanut oil': 'oil',
  'whole milk': 'milk', 'skim milk': 'milk', 'evaporated milk': 'milk',
  'heavy cream': 'cream', 'whipping cream': 'cream', 'half and half': 'cream',
  'rolled oats': 'oats', 'old fashioned oats': 'oats', 'oatmeal': 'oats',
  'cocoa powder': 'cocoa',
  'corn starch': 'cornstarch',
  walnuts: 'nuts', pecans: 'nuts', 'pecan halves': 'nuts', 'chopped nuts': 'nuts',
  'chocolate chip': 'chocolate chips', 'chocolate morsels': 'chocolate chips',
  'greek yogurt': 'yogurt', 'plain yogurt': 'yogurt',
  'parmesan cheese': 'parmesan', parmigiano: 'parmesan', parm: 'parmesan',
  'homemade bread crumbs': 'bread crumbs', panko: 'bread crumbs',
}

// Leading words safe to drop when matching (prep/quality adjectives only).
const ADJ = new Set([
  'warm',
  'cold',
  'hot',
  'fresh',
  'dried',
  'chopped',
  'ground',
  'minced',
  'grated',
  'melted',
  'softened',
  'sifted',
  'packed',
  'whole',
  'large',
  'small',
  'medium',
  'ripe',
  'raw',
  'fine',
  'coarse',
  'shredded',
  'crushed',
  'toasted',
  'cooked',
  'uncooked',
  'unsalted',
  'salted',
  'sweetened',
  'unsweetened',
  'light',
  'dark',
  'extra',
  'virgin',
  'boiling',
  'granulated',
  'white',
  'plain',
  'quick',
  'rolled',
  'dry',
  'roasted',
  'canned',
  'frozen',
])

const clean = (s) => String(s ?? '').toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
const resolve = (s) => {
  const key = ALIASES[s] || s
  return DENSITY[key] != null ? key : null
}

// Ingredient name -> canonical density key, or null. Strips only known adjectives,
// so it never mis-matches (e.g. "almond milk" / "cocoa butter" -> null, not milk/butter).
export function canonicalize(name) {
  const s = clean(name)
  let hit = resolve(s)
  if (hit) return hit
  const words = s.split(' ')
  while (words.length > 1 && ADJ.has(words[0])) {
    words.shift()
    hit = resolve(words.join(' '))
    if (hit) return hit
  }
  return null
}

// Convert a volume amount to grams, or null if not convertible.
export function toGrams(value, unit, key) {
  const u = UNITS[unit]
  if (!u || u.dim !== 'volume' || key == null || DENSITY[key] == null) return null
  const cups = (value * u.ml) / UNITS.c.ml
  return Math.round(cups * DENSITY[key])
}
