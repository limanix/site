import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const referenceDir = fileURLToPath(new URL('../.reference/', import.meta.url))

const guestChecks = { 'limanix doctor': 'lmx doctor', 'limanix network check': 'lmx net check' }
const flagTypes = { string: 'string', strings: 'strings', int: 'integer', uint16: 'integer' }

const cell = (text) =>
  (text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\s*\n\s*/g, ' ')
    .trim()
    .split(/(`[^`]*`)/)
    .map((part) => (part.startsWith('`') ? part : part.replace(/</g, '&lt;').replace(/>/g, '&gt;')))
    .join('')
const sentence = (text) => {
  const value = cell(text)
  return !value || /[.!?:]$/.test(value) ? value : `${value}.`
}
const code = (text) => `\`${text}\``
export const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function table(header, rows) {
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n')
}

function region(name, body) {
  return `<!-- #region ${name} -->\n${body}\n<!-- #endregion ${name} -->\n\n`
}

function either(values) {
  const quoted = values.map(code)
  return quoted.length < 2
    ? quoted.join('')
    : `${quoted.slice(0, -1).join(', ')} or ${quoted.at(-1)}`
}

function argumentName(arg) {
  return [arg.short, arg.name].filter(Boolean).map(code).join(', ')
}

const statedDefault = /\s*\[default: ([^\]]+)\]\.?$/

function argumentDefault(arg) {
  if (arg.required) return 'required'
  if (arg.default !== null) return code(arg.default)
  const stated = statedDefault.exec(arg.about ?? '')
  if (stated) return code(stated[1])
  return arg.value === null && arg.name.startsWith('-') ? code('false') : 'none'
}

function argumentAbout(arg) {
  return sentence((arg.about ?? '').replace(statedDefault, ''))
}

export function flagsTable(entry) {
  return table(
    ['Flag', 'Type', 'Default', 'Description'],
    entry.args.map((arg) => [
      argumentName(arg),
      arg.value === null ? 'boolean' : (flagTypes[arg.value] ?? arg.value),
      argumentDefault(arg),
      argumentAbout(arg),
    ]),
  )
}

export function checksTable(entry, lmx) {
  const guest = lmx.commands.find((command) => command.name === guestChecks[entry.name])
  const rows = []
  for (const check of entry.checks) {
    if (check.id === 'guest') {
      rows.push(...(guest?.checks ?? []).map((inner) => [code(inner.id), sentence(inner.what)]))
    }
    rows.push([code(check.id), sentence(check.what)])
  }
  return table(['Check', 'What it checks'], rows)
}

export function argumentsTable(entry) {
  return table(
    ['Argument or option', 'Default', 'Description'],
    entry.args.map((arg) => [argumentName(arg), argumentDefault(arg), argumentAbout(arg)]),
  )
}

export function valuesTables(entry) {
  return entry.args
    .filter((arg) => arg.values.length > 0)
    .map((arg) =>
      table(
        [`Value of ${code(arg.name)}`, 'Meaning'],
        arg.values.map((value) => [code(value.name), sentence(value.about)]),
      ),
    )
    .join('\n\n')
}

export function lmxChecksTable(entry) {
  return table(
    ['Check', 'What it checks'],
    entry.checks.map((check) => [code(check.id), sentence(check.what)]),
  )
}

function about(entry) {
  const summary = sentence(entry.about)
  const details = sentence(entry.details)
  const body =
    !details || details.startsWith(summary.replace(/\.$/, ''))
      ? details || summary
      : `${summary}\n\n${details}`
  return region(`${slug(entry.name)}-about`, body)
}

export function renderCli(client, lmx) {
  return client.commands
    .map((entry) =>
      [
        about(entry),
        region(`${slug(entry.name)}-usage`, `\`\`\`sh [Mac]\n${entry.usage}\n\`\`\``),
        entry.args.length > 0 ? region(slug(entry.name), flagsTable(entry)) : '',
        entry.checks.length > 0
          ? region(`${slug(entry.name)}-checks`, checksTable(entry, lmx))
          : '',
      ].join(''),
    )
    .join('')
}

export function renderLmx(lmx) {
  return lmx.commands
    .map((entry) => {
      const values = valuesTables(entry)
      return [
        about(entry),
        entry.args.length > 0 ? region(slug(entry.name), argumentsTable(entry)) : '',
        values ? region(`${slug(entry.name)}-values`, values) : '',
        entry.checks.length > 0 ? region(`${slug(entry.name)}-checks`, lmxChecksTable(entry)) : '',
      ].join('')
    })
    .join('')
}

function configDefault(field) {
  if (field.default !== null) return code(field.default)
  return field.required ? 'required' : '—'
}

export function configTable(fields, prefix) {
  const keys = fields.filter((field) => {
    if (field.type === 'table') return false
    const parent = field.key.includes('.') ? field.key.slice(0, field.key.lastIndexOf('.')) : ''
    return parent === prefix
  })
  return table(
    ['Key', 'Type', 'Default', 'Description'],
    keys.map((field) => [
      code(field.key.slice(field.key.lastIndexOf('.') + 1)),
      field.choices.length > 0 ? either(field.choices.map((choice) => `"${choice}"`)) : field.type,
      configDefault(field),
      sentence(field.doc),
    ]),
  )
}

export function renderConfig(client) {
  const tables = [
    '',
    ...client.config
      .filter((field) => field.type === 'table' || field.type === 'array of tables')
      .map((field) => (field.type === 'array of tables' ? `${field.key}[]` : field.key)),
  ]
  return [
    ...tables.map((prefix) =>
      region(`config-${slug(prefix) || 'top'}`, configTable(client.config, prefix)),
    ),
    region('config-example', `\`\`\`toml [limanix.toml]\n${client.example.trimEnd()}\n\`\`\``),
  ].join('')
}

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!response.ok) throw new Error(`Reference download failed: ${response.status} ${url}`)
  return response
}

async function readJSON(root, repository, ref, path) {
  if (root) return JSON.parse(readFileSync(resolve(root, path), 'utf8'))
  return (await download(`https://raw.githubusercontent.com/${repository}/${ref}/${path}`)).json()
}

export async function loadSources(env = process.env) {
  const clientRef = env.CLIENT_ROOT
    ? 'local'
    : env.CLIENT_REF ||
      (await (await download('https://api.github.com/repos/limanix/client/releases/latest')).json())
        .tag_name
  if (!env.CLIENT_ROOT && !/^v[0-9]+\.[0-9]+\.[0-9]+(\+[0-9]+)?$/.test(clientRef)) {
    throw new Error(`Invalid client release: ${clientRef}`)
  }
  const client = await readJSON(env.CLIENT_ROOT, 'limanix/client', clientRef, 'reference.json')
  const pin = await readJSON(
    env.CLIENT_ROOT,
    'limanix/client',
    clientRef,
    'internal/nixos/resources/base/lmx.json',
  )
  const lmxRef = env.LMX_ROOT ? 'local' : `v${pin.version}`
  const lmx = await readJSON(env.LMX_ROOT, 'limanix/lmx', lmxRef, 'reference.json')
  return { client: { ...client, ref: clientRef }, lmx: { ...lmx, ref: lmxRef } }
}

async function prepare() {
  const { client, lmx } = await loadSources()
  mkdirSync(referenceDir, { recursive: true })
  writeFileSync(join(referenceDir, 'cli.md'), renderCli(client, lmx))
  writeFileSync(join(referenceDir, 'lmx.md'), renderLmx(lmx))
  writeFileSync(join(referenceDir, 'config.md'), renderConfig(client))
  console.log(`Reference: client ${client.ref}, lmx ${lmx.ref}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await prepare()
}
