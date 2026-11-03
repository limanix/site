import { loadCatalog } from '../../scripts/lib/artifacts.mjs'

export default {
  paths() {
    return loadCatalog().entries.map(({ name, content }) => ({
      params: { module: name },
      content,
    }))
  },
}
