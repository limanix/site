import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { catalogDir } from './paths.mjs'

// VitePress and the page checker read the catalog written by prepare.mjs.
export function loadCatalog() {
  return JSON.parse(readFileSync(join(catalogDir, 'catalog.json'), 'utf8'))
}
