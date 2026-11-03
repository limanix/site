import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { catalogKinds, renderPage } from './render.mjs'

export function readCatalog(root, ref) {
  const modules = Object.keys(catalogKinds).flatMap((kind) => readModules(root, kind))
  modules.sort((a, b) => a.title.localeCompare(b.title, 'en'))

  const routes = new Map(modules.map(({ source, name }) => [source, `/modules/${name}`]))
  const entries = modules.map(({ markdown, ...entry }) => ({
    ...entry,
    content: renderPage(markdown, entry.source, ref, routes),
  }))

  const previews = { themes: readPreviews(root, 'themes'), prompts: readPreviews(root, 'prompts') }

  return { ref, entries, previews }
}

function readModules(root, kind) {
  const directories = readdirSync(join(root, 'catalog', kind), { withFileTypes: true })

  return directories
    .filter((directory) => directory.isDirectory())
    .map(({ name }) => {
      if (name === 'index' || name === 'custom') throw new Error(`Reserved catalog page: ${name}`)

      const source = `catalog/${kind}/${name}/README.md`
      const markdown = readFileSync(join(root, source), 'utf8')
      const title = markdown.match(/^# (.+)\r?$/m)?.[1]
      if (!title) throw new Error(`Missing title in ${source}`)

      return { name, kind, title, source, markdown }
    })
}

function readPreviews(root, kind) {
  const items = JSON.parse(readFileSync(join(root, 'previews', `${kind}.json`), 'utf8'))

  return items.map((item) => ({
    ...item,
    svg: readFileSync(join(root, 'previews', kind, `${item.name}.svg`), 'utf8'),
  }))
}
