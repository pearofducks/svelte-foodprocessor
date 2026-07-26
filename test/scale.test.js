import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseAmount, prettify, normalize, formatAmount } from '../src/scale.js'

const fmt = (raw, mult) => formatAmount(parseAmount(raw), mult)

test('parseAmount: known units and aliases', () => {
  assert.equal(parseAmount('2 c').unit, 'c')
  assert.equal(parseAmount('2 cups').unit, 'c')
  assert.equal(parseAmount('1 tbsp').unit, 'T')
  assert.equal(parseAmount('1 teaspoon').unit, 't')
  assert.equal(parseAmount('240 g').dim, 'mass')
  assert.deepEqual(parseAmount('1 t'), {
    numeric: 1, unit: 't', dim: 'volume', content: 'teaspoon', canPretty: true, canSuffix: true,
  })
})

test('parseAmount: bare number is a count', () => {
  const m = parseAmount('4')
  assert.equal(m.numeric, 4)
  assert.equal(m.dim, 'count')
  assert.equal(m.unit, null)
})

test('parseAmount: non-numeric and empty', () => {
  assert.equal(parseAmount('a pinch').numeric, null)
  assert.equal(parseAmount('').content, '')
})

test('parseAmount: ranges/compounds carry no unit (frozen downstream)', () => {
  assert.equal(parseAmount('6 to 8 oz').unit, null)
  assert.equal(parseAmount('1.5 cups + 3 tablespoons').unit, null)
  assert.equal(parseAmount('2 or 3').unit, null)
})

test('prettify: glyph snap and decimal fallback', () => {
  assert.equal(prettify(0.5), '½')
  assert.equal(prettify(2.25), '2¼')
  assert.equal(prettify(3), '3')
  assert.equal(prettify(0.3), '0.3') // no nice glyph within eps -> decimal
})

test('normalize: step down only, never over-promote', () => {
  assert.equal(normalize(0.5, 'T').unit, 't') // 1/2 T -> tsp
  assert.equal(normalize(0.125, 'c').unit, 'T') // 1/8 cup -> Tbsp
  assert.equal(normalize(0.5, 'c').unit, 'c') // 1/2 cup stays
  assert.equal(normalize(3, 't').unit, 't') // 3 tsp stays (no promote to 1 T)
  assert.equal(normalize(6, 'T').unit, 'T') // 6 Tbsp stays (no promote to 3/8 cup)
  assert.equal(normalize(240, 'g').unit, 'g') // mass untouched
})

test('formatAmount: unit normalization (F1)', () => {
  assert.equal(fmt('1 T', 0.5), '1½ teaspoons')
  assert.equal(fmt('0.25 c', 0.5), '2 tablespoons')
  assert.equal(fmt('1 c', 0.5), '½ cup')
  assert.equal(fmt('1 T', 2), '2 tablespoons')
})

test('formatAmount: grams stay decimal', () => {
  assert.equal(fmt('185 g', 0.5), '92.5 grams')
  assert.equal(fmt('1 g', 0.5), '0.5 gram')
  assert.equal(fmt('240 g', 2), '480 grams')
})

test('formatAmount: counts fractionify, nouns pluralize/singularize', () => {
  assert.equal(fmt('1', 0.5), '½')
  assert.equal(fmt('1', 2), '2')
  assert.equal(fmt('2 cloves', 0.5), '1 clove')
  assert.equal(fmt('1 can', 2), '2 cans')
})

test('formatAmount: at-rest and edge cases', () => {
  assert.equal(fmt('2.5 c', 1), '2½ cups')
  assert.equal(fmt('4', 1), '4')
  assert.equal(fmt('a pinch', 1), 'a pinch')
  assert.equal(fmt('', 1), '')
})

test('scaling always uses the immutable base (no compounding drift)', () => {
  const m = parseAmount('0.75 c')
  assert.equal(formatAmount(m, 1), '¾ cup')
  assert.equal(formatAmount(m, 2), '1½ cups')
  assert.equal(formatAmount(m, 0.5), '⅜ cup') // 3/8 cup >= 1/4-cup min, stays cups
  assert.equal(formatAmount(m, 1), '¾ cup') // back to base, unchanged
})
