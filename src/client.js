// Progressive enhancement for statically rendered recipe pages.
// The SSR DOM is authoritative; this script only attaches behavior (no hydration).
//   1. portion buttons scale ingredient amounts (half / whole / double)
//   2. volume/weight buttons swap known amounts to grams
//   3. clicking an ingredient toggles a "completed" state (ephemeral)
// Bundled to out/bundle.js by renderer.js (vite build), which inlines the imports.
import { formatAmount } from './scale.js'
import { toGrams } from './density-table.js'

;(() => {
  const container = document.querySelector('.container')
  if (!container) return

  // Amounts we must not scale: a range / compound / ratio keeps a second number
  // (or connective) inside data-content, so scaling the lead number would lie.
  const UNSCALABLE = /\d|\bto\b|\bor\b|\bper\b|\+/

  const modelOf = (ds) => ({
    numeric: ds.numeric == null || ds.numeric === '' ? null : parseFloat(ds.numeric),
    unit: ds.unit || null,
    dim: ds.dim || null,
    content: ds.content || '',
    canPretty: ds.canPretty === 'true',
    canSuffix: ds.canSuffix === 'true',
  })

  const lefts = [...container.querySelectorAll('.ingredient .left')]
  const baseHtml = new Map(lefts.map((el) => [el, el.innerHTML])) // restored at x1 volume

  let factor = 1
  let weight = false

  const render = () => {
    for (const el of lefts) {
      const raw = el.dataset.numeric
      if (raw == null || raw === '') continue // note rows: nothing to scale
      if (UNSCALABLE.test(el.dataset.content || '')) continue // freeze ranges / compounds
      if (weight && el.dataset.dim === 'volume' && el.dataset.key) {
        const g = toGrams(parseFloat(raw) * factor, el.dataset.unit, el.dataset.key)
        if (g != null) { el.textContent = `${g} g`; continue }
      }
      if (factor === 1) el.innerHTML = baseHtml.get(el) // exact restore
      else el.textContent = formatAmount(modelOf(el.dataset), factor)
    }
  }

  /* ---- button groups (portions + units) -------------------------------- */

  const initGroup = (selector) => {
    const btns = [...container.querySelectorAll(selector)]
    btns.forEach((b) => {
      b.setAttribute('type', 'button')
      b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false')
    })
    return btns
  }
  const setActive = (btns, btn) => {
    for (const b of btns) {
      const on = b === btn
      b.classList.toggle('active', on)
      b.setAttribute('aria-pressed', on ? 'true' : 'false')
    }
  }

  const portionBtns = initGroup('.portion')

  // Weight toggle is only useful if something on the page can convert.
  const unitsSection = container.querySelector('.units')
  const hasConvertible = lefts.some((el) => el.dataset.dim === 'volume' && el.dataset.key)
  let unitBtns = []
  if (unitsSection && !hasConvertible) unitsSection.remove()
  else unitBtns = initGroup('.unit')

  /* ---- ingredient check-off (ephemeral, whole row) ---------------------- */

  for (const row of container.querySelectorAll('.ingredient')) {
    row.setAttribute('role', 'checkbox')
    row.setAttribute('tabindex', '0')
    row.setAttribute('aria-checked', 'false')
  }
  const toggle = (row) => {
    const on = row.classList.toggle('completed')
    row.setAttribute('aria-checked', on ? 'true' : 'false')
  }

  /* ---- one delegated listener ------------------------------------------ */

  container.addEventListener('click', (e) => {
    const portion = e.target.closest('.portion')
    if (portion) {
      setActive(portionBtns, portion)
      factor = parseFloat(portion.dataset.portion)
      render()
      return
    }
    const unit = e.target.closest('.unit')
    if (unit) {
      setActive(unitBtns, unit)
      weight = unit.dataset.mode === 'weight'
      render()
      return
    }
    if (e.target.closest('a')) return // links navigate, don't toggle
    const row = e.target.closest('.ingredient')
    if (row) toggle(row)
  })

  container.addEventListener('keydown', (e) => {
    if (e.key !== ' ' && e.key !== 'Enter') return
    const row = e.target.closest?.('.ingredient')
    if (!row) return
    e.preventDefault()
    toggle(row)
  })
})()
