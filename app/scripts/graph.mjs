import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { download, latestRelease } from '../../docs/scripts/lib/sources.mjs'

const { MODULES_ROOT } = process.env
const target = new URL('../.catalog/graph.json', import.meta.url)

const ref = MODULES_ROOT ? 'local' : await latestRelease('limanix/modules')
const text = MODULES_ROOT
  ? await readFile(join(MODULES_ROOT, 'catalog/graph.json'), 'utf8')
  : await downloadGraph(ref)

await mkdir(new URL('./', target), { recursive: true })
await writeFile(target, text)

console.log(`Catalog ${ref}: ${JSON.parse(text).modules.length} graph nodes`)

async function downloadGraph(release) {
  const url = `https://raw.githubusercontent.com/limanix/modules/${release}/catalog/graph.json`
  const response = await download(url)
  return response.text()
}
