import { posix } from 'node:path'

const codeFence = /^\s*(```|~~~)/

export function checkPages(pages) {
  const problems = []

  for (const [route, page] of pages) checkPage(route, page, pages, problems)

  return problems
}

function checkPage(route, page, pages, problems) {
  let insideCode = false

  page.text.split('\n').forEach((line, index) => {
    const report = (message) => problems.push(`${page.path}:${index + 1}: ${message}`)

    if (codeFence.test(line)) {
      insideCode = !insideCode
      return
    }
    if (insideCode) return

    checkLinks(line, route, page.path, pages, report)
  })
}

function checkLinks(line, route, sourcePath, pages, report) {
  for (const [, href] of line.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) continue

    const [target, anchor] = href.split('#')
    const path = target.split('?')[0]
    const resolved = path ? posix.resolve('/', posix.dirname(sourcePath), path) : route
    const to = resolved.replace(/\/index\.(md|html)$/, '/').replace(/\.(md|html)$/, '')

    const page = pages.get(to) ?? pages.get(to.replace(/\/$/, '')) ?? pages.get(`${to}/`)
    if (!page) report(`no such page: ${href}`)
    else if (anchor && !page.anchors.has(anchor)) report(`no such anchor: ${href}`)
  }
}
