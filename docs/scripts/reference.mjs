import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const referenceDir = fileURLToPath(new URL('../.reference/', import.meta.url))

const guestChecks = { 'limanix doctor': 'lmx doctor', 'limanix network check': 'lmx net check' }
const flagTypes = { string: 'string', strings: 'strings', int: 'integer', uint16: 'integer' }
const updates = {
  fixed: [
    'Fixed at creation',
    '`limanix update` rejects a change. Create a new VM and copy the files you need.',
  ],
  grow: ['Can grow, not shrink', '`limanix update` can raise it. It cannot shrink.'],
}
const known = {
  client: {
    '': 'commands exit_statuses environment config example',
    'commands[]': 'name usage about details args checks output columns json',
    'environment[]': 'id default what',
    'config[]': 'key type required default choices doc example format update',
  },
  lmx: {
    '': 'commands exit_statuses environment check_statuses status_lines short_words',
    'commands[]': 'name usage about details args checks privileges',
  },
  both: {
    'commands[].args[]': 'name short value required default values about details',
    'commands[].args[].values[]': 'name about',
    'exit_statuses[]': 'status what',
  },
}

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

function optional(name, rows, render) {
  return rows?.length > 0 ? region(name, render(rows)) : ''
}

function definitions(header, rows) {
  return table(
    header,
    rows.map((row) => [code(row.id), sentence(row.what)]),
  )
}

function exitTable(statuses) {
  return table(
    ['Status', 'Meaning'],
    statuses.map(({ status, what }) => [status === null ? 'Other' : code(status), sentence(what)]),
  )
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
const isFlag = (arg) => arg.name.startsWith('-')

function argumentDefault(arg) {
  if (arg.required) return 'required'
  if (arg.default !== null) return code(arg.default)
  const stated = statedDefault.exec(arg.about ?? '')
  if (stated) return code(stated[1])
  return arg.value === null && isFlag(arg) ? code('false') : 'none'
}

function argumentAbout(arg) {
  return [sentence((arg.about ?? '').replace(statedDefault, '')), sentence(arg.details)]
    .filter(Boolean)
    .join(' ')
}

function argumentRow(arg) {
  return [
    argumentName(arg),
    arg.value === null ? 'boolean' : (flagTypes[arg.value] ?? arg.value),
    argumentDefault(arg),
    argumentAbout(arg),
  ]
}

export function flagsTable(entry) {
  return table(
    ['Flag', 'Type', 'Default', 'Description'],
    entry.args.filter(isFlag).map(argumentRow),
  )
}

function positionalsTable(entry) {
  return table(
    ['Argument', 'Type', 'Default', 'Description'],
    entry.args.filter((arg) => !isFlag(arg)).map(argumentRow),
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
  return [
    ...client.commands.map((entry) => {
      const name = slug(entry.name)
      return [
        about(entry),
        region(`${name}-usage`, `\`\`\`sh [Mac]\n${entry.usage}\n\`\`\``),
        optional(
          `${name}-arguments`,
          entry.args.filter((arg) => !isFlag(arg)),
          () => positionalsTable(entry),
        ),
        optional(name, entry.args.filter(isFlag), () => flagsTable(entry)),
        optional(`${name}-values`, valuesTables(entry), (values) => values),
        optional(`${name}-checks`, entry.checks, () => checksTable(entry, lmx)),
        optional(
          `${name}-output`,
          entry.output,
          (lines) => `\`\`\`text [Output]\n${lines.join('\n')}\n\`\`\``,
        ),
        optional(`${name}-columns`, entry.columns, (rows) =>
          definitions(['Column', 'Content'], rows),
        ),
        optional(`${name}-json`, entry.json, (rows) => definitions(['Field', 'Value'], rows)),
      ].join('')
    }),
    optional('limanix-exit-statuses', client.exit_statuses, exitTable),
    optional('limanix-environment', client.environment, (rows) =>
      table(
        ['Variable', 'Default', 'Description'],
        rows.map((row) => [code(row.id), code(row.default), sentence(row.what)]),
      ),
    ),
  ].join('')
}

export function renderLmx(lmx) {
  return [
    ...lmx.commands.map((entry) => {
      const name = slug(entry.name)
      return [
        about(entry),
        optional(`${name}-usage`, entry.usage, (usage) => `\`\`\`sh [VM]\n${usage}\n\`\`\``),
        optional(name, entry.args, () => argumentsTable(entry)),
        optional(`${name}-values`, valuesTables(entry), (values) => values),
        optional(`${name}-checks`, entry.checks, () => lmxChecksTable(entry)),
      ].join('')
    }),
    optional(
      'lmx-privileges',
      lmx.commands.filter((entry) => entry.privileges),
      (rows) =>
        table(
          ['Command', 'Needs'],
          rows.map((entry) => [code(entry.name), sentence(entry.privileges)]),
        ),
    ),
    optional('lmx-exit-statuses', lmx.exit_statuses, exitTable),
    optional('lmx-environment', lmx.environment, (rows) =>
      definitions(['Variable', 'Description'], rows),
    ),
    optional('lmx-check-statuses', lmx.check_statuses, (rows) =>
      definitions(['Status', 'Meaning'], rows),
    ),
    optional('lmx-status-lines', lmx.status_lines, (rows) => definitions(['Line', 'Shows'], rows)),
    optional('lmx-short-words', lmx.short_words, (rows) => definitions(['Word', 'Meaning'], rows)),
  ].join('')
}

function configDefault(field) {
  if (field.default !== null) return code(field.default)
  return field.required ? 'required' : '—'
}

function configAbout(field) {
  const update = updates[field.update]
  return [
    sentence(field.doc),
    sentence(field.format),
    update ? `[${update[0]}](#fixed-at-creation).` : '',
  ]
    .filter(Boolean)
    .join(' ')
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
      configAbout(field),
    ]),
  )
}

export function renderConfig(client) {
  const unknown = client.config.find((field) => field.update && !updates[field.update])
  if (unknown) throw new Error(`Unknown update rule of ${unknown.key}: ${unknown.update}`)
  const tables = [
    '',
    ...client.config
      .filter((field) => field.type === 'table' || field.type === 'array of tables')
      .map((field) => (field.type === 'array of tables' ? `${field.key}[]` : field.key)),
  ]
  return [
    ...client.config
      .filter((field) => field.type.startsWith('table') || field.type === 'array of tables')
      .map((field) => region(`config-${slug(field.key)}-about`, sentence(field.doc))),
    ...tables.map((prefix) =>
      region(`config-${slug(prefix) || 'top'}`, configTable(client.config, prefix)),
    ),
    optional(
      'config-update',
      Object.entries(updates)
        .map(([rule, [, behavior]]) => [
          client.config
            .filter((field) => field.update === rule)
            .map((field) => code(field.key))
            .join(', '),
          behavior,
        ])
        .filter(([keys]) => keys),
      (rows) => table(['Key', 'Behavior'], rows),
    ),
    region('config-example', `\`\`\`toml [limanix.toml]\n${client.example.trimEnd()}\n\`\`\``),
  ].join('')
}

function checkFields(source, data, path = '') {
  if (Array.isArray(data)) {
    for (const item of data) checkFields(source, item, `${path}[]`)
    return
  }
  if (data === null || typeof data !== 'object') return
  const fields = (known[source][path] ?? known.both[path] ?? 'id what').split(' ')
  for (const [key, value] of Object.entries(data)) {
    const field = path ? `${path}.${key}` : key
    if (!fields.includes(key)) {
      throw new Error(`Unknown field ${field} in the ${source} reference.json`)
    }
    checkFields(source, value, field)
  }
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
  checkFields('client', client)
  const pin = await readJSON(
    env.CLIENT_ROOT,
    'limanix/client',
    clientRef,
    'internal/nixos/resources/base/lmx.json',
  )
  const lmxRef = env.LMX_ROOT ? 'local' : `v${pin.version}`
  const lmx = await readJSON(env.LMX_ROOT, 'limanix/lmx', lmxRef, 'reference.json')
  checkFields('lmx', lmx)
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
