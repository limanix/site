import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { loadCatalog } from './catalog.mjs'

const root = process.argv[2] ?? 'pages'

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (name === 'public') continue
    if (statSync(path).isDirectory()) walk(path)
    else if (name.endsWith('.md') && !name.includes('[')) files.push(path)
  }
}
walk(root)

const slugify = (text) =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()

const route = (file) =>
  '/' +
  relative(root, file)
    .replace(/\\/g, '/')
    .replace(/(^|\/)index\.md$/, '$1')
    .replace(/\.md$/, '')

const isFence = (line) => /^\s*(```|~~~)/.test(line)

const pages = new Map()
const inputs = files.map((file) => ({
  file,
  text: readFileSync(file, 'utf8').replace(/<!-- @include: (.+?) -->/g, (_, path) =>
    readFileSync(resolve(dirname(file), path), 'utf8'),
  ),
  catalog: false,
}))
inputs.push(
  ...loadCatalog().entries.map(({ slug, content }) => ({
    file: join(root, 'modules', `${slug}.md`),
    text: content,
    catalog: true,
  })),
)
for (const { file, text: source, catalog } of inputs) {
  const text = source.replace(/^---\n[\s\S]*?\n---\n/, '')
  const anchors = new Set()
  const seen = new Map()
  let fence = false
  for (const line of text.split('\n')) {
    if (isFence(line)) fence = !fence
    const heading = !fence && line.match(/^#{1,6}\s+(.*)$/)
    if (!heading) continue
    const title = heading[1].trim()
    const custom = title.match(/\{#([^}]+)\}$/)
    if (custom) {
      anchors.add(custom[1])
      continue
    }
    // The anchor comes from the rendered text: links keep their text, code and emphasis lose marks.
    let slug = slugify(title.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*]/g, ''))
    const count = seen.get(slug) ?? 0
    seen.set(slug, count + 1)
    if (count) slug = `${slug}-${count}`
    anchors.add(slug)
  }
  pages.set(route(file), { file, text, anchors, catalog })
}

const banned = [
  /\bseamless(ly)?\b/i,
  /\bpowerful\b/i,
  /\bblazing\b/i,
  /\bsimply\b/i,
  /\bjust\b/i,
  /\beas(y|ily)\b/i,
  /, so\b/,
  /\bnext steps\b/i,
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
]

const problems = []
const report = (page, line, message) =>
  problems.push(`${relative(root, page.file)}:${line}: ${message}`)

for (const [path, page] of pages) {
  let fence = null
  let group = false
  page.text.split('\n').forEach((line, index) => {
    const n = index + 1
    const open = line.match(/^\s*(```+|~~~+)(.*)$/)
    if (open && !fence) {
      fence = open[1]
      const info = open[2].trim() || '(no language)'
      if (!page.catalog) {
        if (!group) report(page, n, `code block outside a code group: ${info}`)
        else if (!/\[[^\]]+\]/.test(info)) report(page, n, `code block without a label: ${info}`)
      }
      return
    }
    if (fence) {
      if (line.trim().startsWith(fence) && !line.trim().replace(/[`~]/g, '')) fence = null
      return
    }
    if (/^\s*:::\s*code-group/.test(line)) group = true
    else if (/^\s*:::\s*$/.test(line)) group = false

    const prose = line.replace(/`[^`]*`/g, '')
    // Catalog prose is checked in its own repository; keep checking its links here.
    for (const word of page.catalog ? [] : banned) {
      const match = prose.match(word)
      if (match) report(page, n, `style: "${match[0]}"`)
    }

    for (const [, href] of line.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(https?:|mailto:)/.test(href)) continue
      const [target, hash] = href.split('#')
      const to = (target || path).replace(/\.(md|html)$/, '')
      if (!to.startsWith('/')) {
        report(page, n, `relative link: ${href}`)
        continue
      }
      const dest = pages.get(to) ?? pages.get(to.replace(/\/$/, '')) ?? pages.get(`${to}/`)
      if (!dest) report(page, n, `no such page: ${href}`)
      else if (hash && !dest.anchors.has(hash)) report(page, n, `no such anchor: ${href}`)
    }
  })
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`${pages.size} pages checked`)
