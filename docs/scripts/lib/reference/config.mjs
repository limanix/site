import { code, codeBlock, region, slug, table, tableText } from './markdown.mjs'

export function renderConfig(client) {
  const fields = client.config

  const described = fields.filter(
    ({ type }) => type.startsWith('table') || type === 'array of tables',
  )
  const tables = fields.filter(({ type }) => type === 'table' || type === 'array of tables')
  const prefixes = ['', ...tables.map(({ key, type }) => (type === 'table' ? key : `${key}[]`))]

  return [
    ...described.map(({ key, doc }) => region(`config-${slug(key)}-about`, tableText(doc))),
    ...prefixes.map((prefix) =>
      region(`config-${slug(prefix) || 'top'}`, configTable(fields, prefix)),
    ),
    region('config-update', table(['Key', 'Update'], updateRuleRows(fields))),
    region('config-example', codeBlock('toml [limanix.toml]', client.example.trimEnd())),
  ].join('')
}

function updateRuleRows(fields) {
  return fields.filter(({ update }) => update).map(({ key, update }) => [code(key), code(update)])
}

function configTable(fields, prefix) {
  const keys = fields.filter(({ key, type }) => type !== 'table' && parentTable(key) === prefix)
  return table(['Key', 'Type', 'Default', 'Description'], keys.map(configRow))
}

function parentTable(key) {
  return key.includes('.') ? key.slice(0, key.lastIndexOf('.')) : ''
}

function configRow(field) {
  const name = field.key.slice(field.key.lastIndexOf('.') + 1)
  const type = field.choices.length > 0 ? choiceList(field.choices) : field.type
  return [code(name), type, configDefault(field), configAbout(field)]
}

function choiceList(choices) {
  const quoted = choices.map((choice) => code(`"${choice}"`))
  if (quoted.length < 2) return quoted.join('')
  return `${quoted.slice(0, -1).join(', ')} or ${quoted.at(-1)}`
}

function configDefault(field) {
  if (field.default !== null) return code(field.default)
  return field.required ? 'required' : '—'
}

function configAbout(field) {
  return [tableText(field.doc), tableText(field.format)].filter(Boolean).join(' ')
}
