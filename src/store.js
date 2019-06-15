const slugify = (s) => s.toString()
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^\w\-]+/g, '')
  .replace(/\-\-+/g, '-')
  .replace(/^-+/, '')
  .replace(/-+$/, '')

const recipes = window.recipes.sort((a, b) => a.name.localeCompare(b.name)).reduce((accum, r) => {
  accum[slugify(r.name)] = { name: r.name, what: r.what, how: r.how.join('\n\n') }
  return accum
}, {})

export { recipes }
