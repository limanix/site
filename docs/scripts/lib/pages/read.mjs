import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, extname, join, posix, relative, resolve } from 'node:path'

const codeFence = /^\s*(```|~~~)/

export function readPages({ root, catalogEntries }) {
  const pages = new Map()

  for (const file of markdownFiles(root)) {
    addPage(pages, root, file, expandIncludes(file, root))
  }
  for (const { name, content } of catalogEntries) {
    addPage(pages, root, join(root, 'modules', `${name}.md`), content)
  }

  return pages
}

function addPage(pages, root, file, source) {
  const path = relative(root, file)
  const route = path.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
  const text = source.replace(/^---\n[\s\S]*?\n---\n/, '')

  pages.set(`/${route}`, { path, text, anchors: anchorsOf(text) })
}

function markdownFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (name === 'public') return []
    if (statSync(path).isDirectory()) return markdownFiles(path)
    return name.endsWith('.md') && !name.includes('[') ? [path] : []
  })
}

function expandIncludes(file, root) {
  const source = readFileSync(file, 'utf8')
  return source.replace(/<!-- @include: (.+?) -->/g, (directive, target, offset) => {
    const [path, name] = target.split('#')
    const includedFile = resolve(dirname(file), path)
    let text
    try {
      text = readFileSync(includedFile, 'utf8')
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error
      throw new Error(`${relative(root, file)}: no include file ${path}`, { cause: error })
    }
    if (name) {
      const region = text.match(
        new RegExp(`<!-- #region ${name} -->\\n([\\s\\S]*?)\\n<!-- #endregion ${name} -->`),
      )
      if (!region) throw new Error(`${relative(root, file)}: no region ${name} in ${path}`)
      text = region[1]
    }

    if (extname(includedFile) !== '.md' || !standaloneInclude(source, offset, directive.length)) {
      return text
    }
    const directory = relative(dirname(file), dirname(includedFile))
    return text.replace(/\]\((\.[^)\s]*)\)/g, (_, href) => {
      const rebased = posix.join(directory, href)
      return `](${rebased.startsWith('.') ? rebased : `./${rebased}`})`
    })
  })
}

function standaloneInclude(source, offset, length) {
  const start = source.lastIndexOf('\n', offset - 1) + 1
  const nextLine = source.indexOf('\n', offset + length)
  const end = nextLine === -1 ? source.length : nextLine
  if (source.slice(start, offset).trim() || source.slice(offset + length, end).trim()) return false

  let insideCode = false
  for (const line of source.slice(0, offset).split('\n')) {
    if (codeFence.test(line)) insideCode = !insideCode
  }
  return !insideCode
}

function anchorsOf(text) {
  const anchors = new Set()
  const timesSeen = new Map()
  let insideCode = false

  for (const line of text.split('\n')) {
    if (codeFence.test(line)) insideCode = !insideCode

    const heading = !insideCode && line.match(/^#{1,6}\s+(.*)$/)
    if (!heading) continue

    const title = heading[1].trim()
    const customAnchor = title.match(/\{#([^}]+)\}$/)
    if (customAnchor) {
      anchors.add(customAnchor[1])
      continue
    }

    const slug = vitepressSlug(title.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*]/g, ''))
    const count = timesSeen.get(slug) ?? 0
    timesSeen.set(slug, count + 1)
    anchors.add(count > 0 ? `${slug}-${count}` : slug)
  }

  return anchors
}

function vitepressSlug(text) {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}
