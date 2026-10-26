import { loadCatalog } from '../../scripts/catalog.mjs'

export default {
  paths() {
    return loadCatalog().entries.map(({ slug, content }) => ({
      params: { module: slug },
      content,
    }))
  },
}
