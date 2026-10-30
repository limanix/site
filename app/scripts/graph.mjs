import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { catalogSlug } from '../../docs/scripts/catalog.mjs'

const repository = 'limanix/modules'
const target = new URL('../.catalog/graph.json', import.meta.url)

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!response.ok) throw new Error(`Catalog download failed: ${response.status} ${url}`)
  return response.json()
}

async function load() {
  if (process.env.MODULES_ROOT) {
    const file = resolve(process.env.MODULES_ROOT, 'catalog/graph.json')
    return { ref: 'local', graph: JSON.parse(await readFile(file, 'utf8')) }
  }
  const ref =
    process.env.MODULES_REF ||
    (await download(`https://api.github.com/repos/${repository}/releases/latest`)).tag_name
  if (!/^v[1-9][0-9]*$/.test(ref)) throw new Error(`Invalid modules release: ${ref}`)
  const url = `https://raw.githubusercontent.com/${repository}/${ref}/catalog/graph.json`
  return { ref, graph: await download(url) }
}

const { ref, graph } = await load()
if (!Array.isArray(graph.modules) || !graph.modules.length) {
  throw new Error(`Catalog ${ref} has no graph nodes`)
}
const modules = graph.modules.map((node) => ({
  ...node,
  page: node.module ? catalogSlug(node.module) : null,
}))
await mkdir(new URL('./', target), { recursive: true })
await writeFile(target, `${JSON.stringify({ ...graph, modules })}\n`)
console.log(`Catalog ${ref}: ${graph.modules.length} graph nodes`)
