import { mkdir, writeFile } from 'node:fs/promises'
import { latestRelease, readRepositoryFile } from '../../docs/scripts/lib/sources.mjs'

const { MODULES_ROOT } = process.env
const target = new URL('../.catalog/graph.json', import.meta.url)

const ref = MODULES_ROOT ? 'local' : await latestRelease('limanix/modules')
const text = await readRepositoryFile(MODULES_ROOT, 'limanix/modules', ref, 'catalog/graph.json')
const nodes = JSON.parse(text).modules.length

await mkdir(new URL('./', target), { recursive: true })
await writeFile(target, text)

console.log(`Catalog ${ref}: ${nodes} graph nodes`)
