import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { catalogIndex, readCatalog, renderPage } from './catalog.mjs'

test('catalog links use site pages; source links keep the selected release', () => {
  const source = 'catalog/toolchains/python/README.md'
  const routes = new Map([['catalog/shell/astronvim/README.md', '/modules/astronvim']])
  const content = renderPage(
    `# Python

[Editor](../../shell/astronvim/README.md#language-servers)
[Contract](../../README.md#version-lines)
[Update](https://docs.limanix.dev/vms/update#apply-a-change)
[Local heading](#use)
[Upstream](https://example.com/reference)

\`\`\`text
[Literal](../../shell/astronvim/README.md)
\`\`\`
`,
    source,
    'v7',
    routes,
  )
  assert.match(content, /\]\(\/modules\/astronvim#language-servers\)/)
  assert.match(content, /github.com\/limanix\/modules\/blob\/v7\/catalog\/README.md#version-lines/)
  assert.match(content, /\]\(\/vms\/update#apply-a-change\)/)
  assert.match(content, /\]\(#use\)/)
  assert.match(content, /\]\(https:\/\/example.com\/reference\)/)
  assert.match(content, /\[Literal\]\(\.\.\/\.\.\/shell\/astronvim\/README.md\)/)
  assert.match(content, /catalogSource: catalog\/toolchains\/python\/README.md/)
  assert.match(content, /Catalog \[v7\]/)
})

test('local previews are labeled and never link to an invented local tag', () => {
  const content = renderPage(
    '# Go\n\n[Source](./default.nix)\n',
    'catalog/toolchains/go/README.md',
    'local',
    new Map(),
  )
  assert.match(content, /Local catalog preview/)
  assert.match(content, /\/blob\/main\/catalog\/toolchains\/go\/default.nix/)
  assert.doesNotMatch(content, /\/tag\/local|\/blob\/local/)
})

test('configuration and integration opens on demand', () => {
  const render = (markdown) =>
    renderPage(markdown, 'catalog/toolchains/go/README.md', 'v7', new Map())
  const middle = render(`# Go

Description.

## Configuration and integration

| Boundary | Contract |
| -- | -- |
| Services | No daemon |

## Corner cases
`)
  assert.match(
    middle,
    /\n::: details Configuration and integration\n\n\| Boundary[\s\S]*\n\n:::\n\n## Corner cases\n/,
  )
  assert.doesNotMatch(middle, /## Configuration and integration/)
  assert.match(
    render('# Go\n\nDescription.\n\n## Configuration and integration\n\nText.\n'),
    /::: details Configuration and integration\n\nText.\n\n:::\n$/,
  )
})

test('discovery includes every kind and keeps the published Claude Code address', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'catalog-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  for (const [kind, name, title] of [
    ['shell', 'zsh', 'Zsh'],
    ['toolchains', 'go', 'Go'],
    ['modules', 'claude', 'Claude Code'],
  ]) {
    const directory = join(root, 'catalog', kind, name)
    mkdirSync(directory, { recursive: true })
    writeFileSync(join(directory, 'module.toml'), 'description = "Test module"\n')
    writeFileSync(join(directory, 'README.md'), `# ${title}\n\nDescription.\n`)
  }
  const catalog = readCatalog(root, 'v7')
  assert.deepEqual(
    catalog.entries.map(({ slug }) => slug),
    ['claude-code', 'go', 'zsh'],
  )
  const index = catalogIndex(catalog)
  for (const entry of catalog.entries) assert.ok(index.includes(`/modules/${entry.slug}`))
  assert.match(index, /releases\/tag\/v7/)
  rmSync(join(root, 'catalog/modules/claude/README.md'))
  assert.throws(() => readCatalog(root, 'v7'), /ENOENT/)
})
