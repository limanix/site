import { posix } from 'node:path'

export const catalogKinds = {
  shell: 'Shell components',
  toolchains: 'Toolchains',
  modules: 'Modules',
}

const modulesUrl = 'https://github.com/limanix/modules'
const docsUrl = 'https://docs.limanix.dev'
const promptShells = {
  bash: { title: 'Bash', preset: 'minimal' },
  zsh: { title: 'Zsh', preset: 'terminal' },
}

export function renderPage(markdown, source, ref, routes) {
  let fence = null

  const lines = markdown.split('\n').map((line) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})(.*)$/)
    if (marker) {
      const [, delimiter, suffix] = marker
      if (!fence) fence = delimiter
      else if (
        delimiter[0] === fence[0] &&
        delimiter.length >= fence.length &&
        suffix.trim() === ''
      ) {
        fence = null
      }
      return line
    }
    if (fence) return line

    return line.replace(/\]\(([^)\s]+)\)/g, (_, href) => {
      return `](${pageLink(href, source, ref, routes)})`
    })
  })

  const body = lines.join('\n')
  const origin =
    ref === 'local' ? 'Local catalog preview.' : `Catalog [${ref}](${releaseUrl(ref)}).`
  const description = firstParagraph(markdown)

  return [
    '---',
    `description: ${JSON.stringify(description)}`,
    `catalogSource: ${source}`,
    '---',
    '',
    body.replace(/^(# .+)\n/, `$1\n\n${origin}\n`),
  ].join('\n')
}

function pageLink(href, source, ref, routes) {
  if (href.startsWith(`${docsUrl}/`)) return href.slice(docsUrl.length)
  if (/^(?:[a-z]+:|\/|#)/i.test(href)) return href

  const [path, anchor] = href.split('#')
  const target = posix.normalize(posix.join(posix.dirname(source), path))
  const url = routes.get(target) ?? `${modulesUrl}/blob/${ref === 'local' ? 'main' : ref}/${target}`

  return anchor ? `${url}#${anchor}` : url
}

function firstParagraph(markdown) {
  return markdown
    .split(/\r?\n\s*\r?\n/)[1]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
}

function releaseUrl(ref) {
  return `${modulesUrl}/releases/tag/${ref}`
}

export function catalogIndex(catalog) {
  const version =
    catalog.ref === 'local' ? 'a local checkout' : `[${catalog.ref}](${releaseUrl(catalog.ref)})`

  const sections = Object.entries(catalogKinds).map(([kind, title]) => {
    const pages = catalog.entries.filter((entry) => entry.kind === kind)
    const links = pages.map((entry) => `- [${entry.title}](/modules/${entry.name})`)
    return `## ${title}\n\n${links.join('\n')}`
  })

  return [
    `These pages describe catalog ${version}.`,
    'Your client may bundle an earlier release; check it with `limanix modules list`.',
    '',
    sections.join('\n\n'),
    '',
  ].join('\n')
}

export function promptTable(prompts) {
  const rows = prompts.map((prompt) => {
    const shells = prompt.shells.map((shell) => promptShells[shell])
    const titles = shells.map((shell) => shell.title).join(', ')
    const presets = shells.map((shell) => `\`${shell.preset}\``).join(', ')

    return `| [\`${prompt.name}\`](/modules/${prompt.name}) | ${titles} | ${presets} |`
  })

  return ['| `prompt` | Shells | Presets |', '| --- | --- | --- |', ...rows, ''].join('\n')
}
