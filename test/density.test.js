import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canonicalize, toGrams } from '../src/density-table.js'

test('canonicalize: direct keys and aliases', () => {
  assert.equal(canonicalize('flour'), 'flour')
  assert.equal(canonicalize('vegetable oil'), 'oil')
  assert.equal(canonicalize('all purpose flour'), 'flour')
  assert.equal(canonicalize('heavy cream'), 'cream')
})

test('canonicalize: strips known adjectives', () => {
  assert.equal(canonicalize('unsalted butter'), 'butter')
  assert.equal(canonicalize('warm water'), 'water')
  assert.equal(canonicalize('chopped nuts'), 'nuts')
  assert.equal(canonicalize('light brown sugar'), 'brown sugar')
})

test('canonicalize: safe misses (never a false match)', () => {
  assert.equal(canonicalize('almond milk'), null)
  assert.equal(canonicalize('cocoa butter'), null)
  assert.equal(canonicalize('banana'), null)
  assert.equal(canonicalize('parsley'), null)
})

test('toGrams: volume conversions', () => {
  assert.equal(toGrams(1, 'c', 'flour'), 120)
  assert.equal(toGrams(2, 'c', 'sugar'), 400)
  assert.equal(toGrams(0.5, 'c', 'water'), 118)
  assert.equal(toGrams(1, 't', 'salt'), 6) // tsp of salt -> ~6 g
})

test('toGrams: not convertible -> null', () => {
  assert.equal(toGrams(1, 'g', 'flour'), null) // mass unit, already weight
  assert.equal(toGrams(1, 'c', null), null) // no key
  assert.equal(toGrams(1, 'c', 'parsley'), null) // key not in density table
})
