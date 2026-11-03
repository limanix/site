import { loadCatalog } from './lib/artifacts.mjs'
import { checkPages } from './lib/pages/check.mjs'
import { readPages } from './lib/pages/read.mjs'

const root = process.argv[2] ?? 'pages'
const pages = readPages({ root, catalogEntries: loadCatalog().entries })
const problems = checkPages(pages)

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`${pages.size} pages checked`)
