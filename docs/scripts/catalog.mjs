/** Load module READMEs from one release for VitePress and the page checks.
 * The default is the latest published modules release. MODULES_REF selects a tag;
 * MODULES_ROOT selects a local checkout for review before that release exists.
 * The generated JSON is a build input, never a second copy to edit by hand.
 */
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, posix, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repository = 'https://github.com/limanix/modules'
export const catalogFile = fileURLToPath(new URL('../.catalog/catalog.json', import.meta.url))
const publicDir = fileURLToPath(new URL('../pages/public/', import.meta.url))
export const previewKinds = ['themes', 'prompts']
export const kinds = { shell: 'Shell components', toolchains: 'Toolchains', modules: 'Modules' }
// Keep the existing public address of Claude Code.
export const catalogSlug = (name) => (name === 'claude' ? 'claude-code' : name)

export function readCatalog(root, ref) {
  const entries = []
  for (const kind of Object.keys(kinds)) {
    for (const directory of readdirSync(join(root, 'catalog', kind), { withFileTypes: true })) {
      if (!directory.isDirectory()) continue
      const name = directory.name
      const source = `catalog/${kind}/${name}/README.md`
      if (!existsSync(join(root, 'catalog', kind, name, 'module.toml'))) {
        throw new Error(`Missing module.toml for ${kind}/${name}`)
      }
      const markdown = readFileSync(join(root, source), 'utf8')
      const title = markdown.match(/^# (.+)\r?$/m)?.[1]
      if (!title) throw new Error(`Missing title in ${source}`)
      const slug = catalogSlug(name)
      if (['index', 'custom'].includes(slug) || entries.some((entry) => entry.slug === slug)) {
        throw new Error(`Duplicate or reserved catalog page: ${slug}`)
      }
      entries.push({ name, kind, slug, title, source, markdown })
    }
  }
  if (!entries.length) throw new Error('The catalog is empty')
  const previews = Object.fromEntries(
    previewKinds.map((kind) => [
      kind,
      JSON.parse(readFileSync(join(root, 'previews', `${kind}.json`), 'utf8')).map((item) => ({
        ...item,
        svg: readFileSync(join(root, 'previews', kind, `${item.name}.svg`), 'utf8'),
      })),
    ]),
  )
  entries.sort((a, b) => a.title.localeCompare(b.title, 'en'))
  const routes = new Map(entries.map((entry) => [entry.source, `/modules/${entry.slug}`]))
  return {
    ref,
    entries: entries.map(({ markdown, ...entry }) => ({
      ...entry,
      content: renderPage(markdown, entry.source, ref, routes),
    })),
    previews,
  }
}

export function renderPage(markdown, source, ref, routes) {
  const description = markdown
    .split(/\r?\n\s*\r?\n/)[1]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
  let fence = null
  let details = false
  const body = markdown
    .split('\n')
    .map((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/)
      if (marker) {
        if (!fence) fence = marker[1]
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null
        return line
      }
      if (fence) return line
      const text = line.replace(/\]\(([^)\s]+)\)/g, (_, href) => {
        if (href.startsWith('https://docs.limanix.dev/')) {
          return `](${href.slice('https://docs.limanix.dev'.length)})`
        }
        if (/^(?:[a-z]+:|\/|#)/i.test(href)) return `](${href})`
        const [path, hash] = href.split('#')
        const target = posix.normalize(posix.join(posix.dirname(source), path))
        const url =
          routes.get(target) ?? `${repository}/blob/${ref === 'local' ? 'main' : ref}/${target}`
        return `](${url}${hash ? `#${hash}` : ''})`
      })
      if (!text.startsWith('## ')) return text
      const close = details ? ':::\n\n' : ''
      details = text.trimEnd() === '## Configuration and integration'
      return close + (details ? `::: details ${text.slice(3).trimEnd()}` : text)
    })
    .join('\n')
  const page = details ? `${body.trimEnd()}\n\n:::\n` : body
  const origin =
    ref === 'local'
      ? 'Local catalog preview.'
      : `Catalog [${ref}](${repository}/releases/tag/${ref}).`
  return `---\ndescription: ${JSON.stringify(description)}\ncatalogSource: ${source}\n---\n\n${page.replace(/^(# .+)\n/, `$1\n\n${origin}\n`)}`
}

export function loadCatalog() {
  return JSON.parse(readFileSync(catalogFile, 'utf8'))
}

export function catalogIndex(catalog) {
  const version =
    catalog.ref === 'local'
      ? 'a local checkout'
      : `[${catalog.ref}](${repository}/releases/tag/${catalog.ref})`
  return (
    `These pages describe catalog ${version}.\nYour client may bundle an earlier release; check it with \`limanix modules list\`.\n\n` +
    Object.entries(kinds)
      .map(
        ([kind, title]) =>
          `## ${title}\n\n` +
          catalog.entries
            .filter((entry) => entry.kind === kind)
            .map((entry) => `- [${entry.title}](/modules/${entry.slug})`)
            .join('\n'),
      )
      .join('\n\n') +
    '\n'
  )
}

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!response.ok) throw new Error(`Catalog download failed: ${response.status} ${url}`)
  return response
}

async function prepare() {
  let catalog
  if (process.env.MODULES_ROOT) {
    catalog = readCatalog(resolve(process.env.MODULES_ROOT), 'local')
  } else {
    const ref =
      process.env.MODULES_REF ||
      (
        await (
          await download('https://api.github.com/repos/limanix/modules/releases/latest')
        ).json()
      ).tag_name
    if (!/^v[1-9][0-9]*$/.test(ref)) throw new Error(`Invalid modules release: ${ref}`)
    const temporary = mkdtempSync(join(tmpdir(), 'limanix-catalog-'))
    try {
      const archive = join(temporary, 'catalog.tar.gz')
      const response = await download(
        `https://codeload.github.com/limanix/modules/tar.gz/refs/tags/${ref}`,
      )
      writeFileSync(archive, Buffer.from(await response.arrayBuffer()))
      execFileSync('tar', ['-xzf', archive, '-C', temporary, '--strip-components=1'])
      catalog = readCatalog(temporary, ref)
    } finally {
      rmSync(temporary, { recursive: true, force: true })
    }
  }
  const { previews, ...pages } = catalog
  mkdirSync(dirname(catalogFile), { recursive: true })
  writeFileSync(catalogFile, `${JSON.stringify(pages, null, 2)}\n`)
  writeFileSync(join(dirname(catalogFile), 'index.md'), catalogIndex(catalog))
  for (const [kind, items] of Object.entries(previews)) {
    const data = items.map(({ svg, ...item }) => item)
    writeFileSync(join(dirname(catalogFile), `${kind}.json`), `${JSON.stringify(data, null, 2)}\n`)
    const directory = join(publicDir, kind)
    rmSync(directory, { recursive: true, force: true })
    mkdirSync(directory, { recursive: true })
    for (const item of items) writeFileSync(join(directory, `${item.name}.svg`), item.svg)
  }
  const counts = Object.entries(previews).map(([kind, items]) => `${items.length} ${kind}`)
  console.log(
    `Catalog ${catalog.ref}: ${catalog.entries.length} module pages, ${counts.join(', ')}`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await prepare()
}
