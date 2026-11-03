import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { catalogDir, publicDir } from '../paths.mjs'
import { download, latestRelease } from '../sources.mjs'
import { readCatalog } from './read.mjs'
import { catalogIndex, promptTable } from './render.mjs'

export async function prepareCatalog({ modulesRoot }) {
  const source = await readCatalogSource(modulesRoot)
  const { previews, ...catalog } = source

  mkdirSync(catalogDir, { recursive: true })
  writeFileSync(join(catalogDir, 'catalog.json'), toJson(catalog))
  writeFileSync(join(catalogDir, 'index.md'), catalogIndex(catalog))
  writeFileSync(join(catalogDir, 'prompts.md'), promptTable(previews.prompts))

  for (const [kind, items] of Object.entries(previews)) writePreviews(kind, items)

  return source
}

async function readCatalogSource(modulesRoot) {
  if (modulesRoot) return readCatalog(modulesRoot, 'local')

  const ref = await latestRelease('limanix/modules')
  const directory = mkdtempSync(join(tmpdir(), 'limanix-modules-'))

  try {
    const archive = join(directory, 'modules.tar.gz')
    const response = await download(
      `https://codeload.github.com/limanix/modules/tar.gz/refs/tags/${ref}`,
    )
    writeFileSync(archive, Buffer.from(await response.arrayBuffer()))
    execFileSync('tar', ['-xzf', archive, '-C', directory, '--strip-components=1'])
    return readCatalog(directory, ref)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

function writePreviews(kind, items) {
  const metadata = items.map(({ svg, ...item }) => item)
  writeFileSync(join(catalogDir, `${kind}.json`), toJson(metadata))

  const directory = join(publicDir, kind)
  rmSync(directory, { recursive: true, force: true })
  mkdirSync(directory, { recursive: true })
  for (const { name, svg } of items) writeFileSync(join(directory, `${name}.svg`), svg)
}

function toJson(data) {
  return `${JSON.stringify(data, null, 2)}\n`
}
