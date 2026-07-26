// Progressive enhancement for statically rendered recipe pages.
// The SSR DOM is authoritative; this script only attaches behavior (no hydration,
// no framework, no build step -- it is copied verbatim to out/bundle.js).
//   1. portion buttons scale ingredient amounts (half / whole / double)
//   2. clicking an ingredient toggles a "completed" state (ephemeral)
;(() => {
  const container = document.querySelector('.container')
  if (!container) return

  /* ---- portion scaling -------------------------------------------------- */

  // Snap a decimal to the nearest nice fraction as a unicode glyph. These are the
  // same codepoints the SSR output resolves its &frac..; entities to, so the whole
  // (restored) and half/double (computed) states render in an identical style.
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
  const round2 = (n) => Math.round(n * 100) / 100
  const toFraction = (n, eps = 0.03) => {
    const whole = Math.floor(n)
    const rem = n - whole
    if (rem < eps) return String(whole)
    const hit = GLYPHS.find(([v]) => Math.abs(rem - v) < eps)
    return hit ? `${whole || ''}${hit[1]}` : String(round2(n))
  }

  // Curated singular -> plural for freeform count nouns (data-content is not a
  // known measure, so pluralization isn't automatic). Only these exact words are
  // touched, so adjectives like "medium"/"large" are never mangled.
  const COUNT_NOUNS = {
    clove: 'cloves', can: 'cans', stick: 'sticks', slice: 'slices',
    lemon: 'lemons', lime: 'limes', leaf: 'leaves', package: 'packages',
    pound: 'pounds', dash: 'dashes', pinch: 'pinches',
  }
  const toSingular = Object.fromEntries(
    Object.entries(COUNT_NOUNS).map(([s, p]) => [p, s]),
  )

  // Amounts we must not scale: a range / compound / ratio keeps a second number
  // (or connective) inside data-content, so scaling the lead number would lie.
  const UNSCALABLE = /\d|\bto\b|\bor\b|\bper\b|\+/

  const lefts = [...container.querySelectorAll('.ingredient .left')]
  const baseHtml = new Map(lefts.map((el) => [el, el.innerHTML])) // restored at x1

  const rescale = (factor) => {
    for (const el of lefts) {
      const raw = el.dataset.numeric
      if (raw == null || raw === '') continue // note rows: nothing to scale
      if (factor === 1) { el.innerHTML = baseHtml.get(el); continue } // exact restore
      const content = el.dataset.content || ''
      if (UNSCALABLE.test(content)) continue // freeze ranges / compounds
      const base = parseFloat(raw)
      if (Number.isNaN(base)) continue
      const n = base * factor // always from immutable base
      const num = el.dataset.canPretty === 'true' ? toFraction(n) : String(round2(n))
      let unit = content
      if (el.dataset.canSuffix === 'true') {
        if (n > 1) unit = `${content}s` // cup -> cups
      } else if (n === 1 && toSingular[content]) {
        unit = toSingular[content] // cloves -> clove
      } else if (n > 1 && COUNT_NOUNS[content]) {
        unit = COUNT_NOUNS[content] // stick -> sticks
      }
      el.textContent = `${num} ${unit}`.trim()
    }
  }

  const buttons = [...container.querySelectorAll('.portion')]
  buttons.forEach((b) => {
    b.setAttribute('type', 'button')
    b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false')
  })
  const setActive = (btn) => {
    for (const b of buttons) {
      const on = b === btn
      b.classList.toggle('active', on)
      b.setAttribute('aria-pressed', on ? 'true' : 'false')
    }
  }

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
    const btn = e.target.closest('.portion')
    if (btn) {
      setActive(btn)
      rescale(parseFloat(btn.dataset.portion))
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
