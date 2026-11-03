import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { checkPages } from '../lib/pages/check.mjs'
import { readPages } from '../lib/pages/read.mjs'

function fixture(t, files, catalogEntries = []) {
  const directory = mkdtempSync(join(tmpdir(), 'pages-test-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const root = join(directory, 'pages')
  mkdirSync(root)

  for (const [path, text] of Object.entries(files)) {
    const file = join(directory, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, text)
  }

  return () => readPages({ root, catalogEntries })
}

test('local pages link to catalog pages, duplicate headings and custom anchors', (t) => {
  const read = fixture(
    t,
    {
      'pages/index.md': `---
title: Home
---
# Home

[Module](/modules/go#usage)
[Repeated heading](/guide#cafe-1)
[Custom anchor](/guide.html#named)
`,
      'pages/guide.md': '# Café\n\n## Café\n\n## Another title {#named}\n',
      'pages/modules/[module].md': '[Template link](/does-not-exist)\n',
      'pages/public/example.md': '[Asset link](/does-not-exist)\n',
    },
    [{ name: 'go', content: '# Go\n\n## Usage\n' }],
  )

  const pages = read()
  assert.equal(pages.size, 3)
  assert.deepEqual(checkPages(pages), [])
})

test('relative links resolve from the source directory, including index pages', (t) => {
  const read = fixture(t, {
    'pages/index.md': '# Home\n',
    'pages/guides/index.md': `# Guides

[Extensionless](./nested#usage)
[Markdown](./nested.md#usage)
[HTML](./nested.html#usage)
[Directory](../reference/#reference)
[Index](../reference/index.md#reference)
[Home](../index.md#home)
[This heading](#guides)
`,
    'pages/guides/nested.md': '# Nested\n\n## Usage\n',
    'pages/reference/index.md': '# Reference\n',
  })

  assert.deepEqual(checkPages(read()), [])
})

test('checker reports only broken links and anchors with line numbers', (t) => {
  const read = fixture(t, {
    'pages/index.md': `# Home

[Relative](./missing.md)
[Missing](/missing)
[Anchor](#missing)

\`\`\`sh
[Example](/missing-in-code)
\`\`\`

\`\`\`
unlabeled
\`\`\`
`,
  })

  assert.deepEqual(checkPages(read()), [
    'index.md:3: no such page: ./missing.md',
    'index.md:4: no such page: /missing',
    'index.md:5: no such anchor: #missing',
  ])
})

test('links in all pages are checked and headings inside code examples are ignored', (t) => {
  const read = fixture(
    t,
    {
      'pages/index.md': `# Home

\`\`\`md
Simply use [this](/missing-in-code).
## Hidden heading
\`\`\`

[Hidden](#hidden-heading)
`,
      'pages/contributing/index.md': '# Contributing\n\nSimply use [this](/missing-in-guide).\n',
    },
    [{ name: 'go', content: '# Go\n\nPowerful [module](/missing-in-catalog).\n' }],
  )

  assert.deepEqual(checkPages(read()), [
    'contributing/index.md:3: no such page: /missing-in-guide',
    'index.md:8: no such anchor: #hidden-heading',
    'modules/go.md:3: no such page: /missing-in-catalog',
  ])
})

test('included links are checked while unused reference regions are allowed', (t) => {
  const read = fixture(t, {
    'pages/index.md': '# Home\n\n<!-- @include: ../.reference/cli.md#used -->\n',
    '.reference/cli.md': `<!-- #region used -->
[Missing](#missing).
<!-- #endregion used -->

<!-- #region unused -->
[Unused link](/not-a-page).
<!-- #endregion unused -->
`,
  })

  assert.deepEqual(checkPages(read()), ['index.md:3: no such anchor: #missing'])
})

test('standalone Markdown includes resolve dot-relative links from the included file', (t) => {
  const read = fixture(t, {
    'pages/index.md': '# Home\n',
    'pages/guide/index.md': '# Guide\n\n<!-- @include: ../snippets/part.md#example -->\n',
    'pages/snippets/part.md': `# Guide

<!-- #region example -->
[Sibling](./target.md#target)
[Parent](../index.md#home)
[Page-local heading](#guide)
[Absolute](/index.md#home)
<!-- #endregion example -->
`,
    'pages/snippets/target.md': '# Target\n',
  })

  assert.deepEqual(checkPages(read()), [])
})

test('inline and non-Markdown includes keep relative links local to the page', (t) => {
  const read = fixture(t, {
    'pages/guide/index.md': `# Guide

Inline: <!-- @include: ../../snippets/inline.md -->

<!-- @include: ../../snippets/example.txt -->
`,
    'pages/guide/target.md': '# Target\n',
    'snippets/inline.md': '[Inline](./target.md#target)',
    'snippets/example.txt': '[Plain text](./target.md#target)',
  })

  assert.deepEqual(checkPages(read()), [])
})

test('missing include regions identify their page and source', (t) => {
  const read = fixture(t, {
    'pages/index.md': '# Home\n\n<!-- @include: ../.reference/cli.md#missing -->\n',
    '.reference/cli.md': '<!-- #region used -->\nText.\n<!-- #endregion used -->\n',
  })

  assert.throws(read, /index\.md: no region missing in \.\.\/\.reference\/cli\.md/)
})

test('missing include files are reported', (t) => {
  const read = fixture(t, {
    'pages/index.md': '# Home\n\n<!-- @include: ../missing.md -->\n',
  })

  assert.throws(read, /index\.md: no include file \.\.\/missing\.md/)
})
