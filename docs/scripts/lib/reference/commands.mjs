import { code, codeBlock, definitions, region, tableText, slug, table } from './markdown.mjs'

const guestCommands = { 'limanix doctor': 'lmx doctor', 'limanix network check': 'lmx net check' }
const flagTypes = { int: 'integer', uint16: 'integer' }
const defaultInAbout = /\s*\[default: ([^\]]+)\]\.?$/

export function renderCli(client, lmx) {
  const commands = client.commands.map((command) => {
    const name = slug(command.name)
    const output = command.output?.join('\n')

    return [
      region(`${name}-about`, about(command)),
      region(`${name}-usage`, codeBlock('sh [Mac]', command.usage)),
      region(`${name}-arguments`, positionalsTable(command)),
      region(name, flagsTable(command)),
      region(`${name}-values`, valuesTables(command)),
      region(`${name}-checks`, checksTable(command, lmx)),
      region(`${name}-output`, output && codeBlock('text [Output]', output)),
      region(`${name}-columns`, definitions(['Column', 'Content'], command.columns)),
      region(`${name}-json`, definitions(['Field', 'Value'], command.json)),
    ].join('')
  })

  return [
    ...commands,
    region('limanix-exit-statuses', exitStatuses(client.exit_statuses)),
    region('limanix-environment', environmentTable(client.environment)),
  ].join('')
}

export function renderLmx(lmx) {
  const commands = lmx.commands.map((command) => {
    const name = slug(command.name)

    return [
      region(`${name}-about`, about(command)),
      region(`${name}-usage`, command.usage && codeBlock('sh [VM]', command.usage)),
      region(name, argumentsTable(command)),
      region(`${name}-values`, valuesTables(command)),
      region(`${name}-checks`, definitions(['Check', 'What it checks'], command.checks)),
    ].join('')
  })

  const privileged = lmx.commands.filter((command) => command.privileges)
  const privileges = privileged.map(({ name, privileges }) => [code(name), tableText(privileges)])

  return [
    ...commands,
    region('lmx-privileges', table(['Command', 'Needs'], privileges)),
    region('lmx-exit-statuses', exitStatuses(lmx.exit_statuses)),
    region('lmx-environment', definitions(['Variable', 'Description'], lmx.environment)),
    region('lmx-check-statuses', definitions(['Status', 'Meaning'], lmx.check_statuses)),
    region('lmx-status-lines', definitions(['Line', 'Shows'], lmx.status_lines)),
    region('lmx-short-words', definitions(['Word', 'Meaning'], lmx.short_words)),
  ].join('')
}

function positionalsTable(command) {
  const positionals = command.args.filter((arg) => !isFlag(arg))
  return table(['Argument', 'Type', 'Default', 'Description'], positionals.map(typedArgument))
}

function flagsTable(command) {
  const flags = command.args.filter(isFlag)
  return table(['Flag', 'Type', 'Default', 'Description'], flags.map(typedArgument))
}

function typedArgument(arg) {
  const type = arg.value === null ? 'boolean' : (flagTypes[arg.value] ?? arg.value)
  return [argumentNames(arg), type, argumentDefault(arg), argumentAbout(arg)]
}

function checksTable(command, lmx) {
  const guest = lmx.commands.find(({ name }) => name === guestCommands[command.name])
  const checks = (command.checks ?? []).flatMap((check) => {
    return check.id === 'guest' ? [...(guest?.checks ?? []), check] : [check]
  })
  return definitions(['Check', 'What it checks'], checks)
}

function environmentTable(variables = []) {
  const rows = variables.map(({ id, default: value, what }) => [
    code(id),
    code(value),
    tableText(what),
  ])
  return table(['Variable', 'Default', 'Description'], rows)
}

function argumentsTable(command) {
  const rows = command.args.map((arg) => [
    argumentNames(arg),
    argumentDefault(arg),
    argumentAbout(arg),
  ])
  return table(['Argument or option', 'Default', 'Description'], rows)
}

function about(command) {
  const summary = tableText(command.about)
  const details = tableText(command.details)

  if (!details) return summary
  if (details.startsWith(summary.replace(/\.$/, ''))) return details
  return `${summary}\n\n${details}`
}

function valuesTables(command) {
  const withValues = command.args.filter((arg) => arg.values.length > 0)

  return withValues
    .map((arg) => {
      const rows = arg.values.map((value) => [code(value.name), tableText(value.about)])
      return table([`Value of ${code(arg.name)}`, 'Meaning'], rows)
    })
    .join('\n\n')
}

function exitStatuses(statuses = []) {
  const rows = statuses.map(({ status, what }) => [
    status === null ? 'Other' : code(status),
    tableText(what),
  ])
  return table(['Status', 'Meaning'], rows)
}

function isFlag(arg) {
  return arg.name.startsWith('-')
}

function argumentNames(arg) {
  return [arg.short, arg.name].filter(Boolean).map(code).join(', ')
}

function argumentDefault(arg) {
  if (arg.required) return 'required'
  if (arg.default !== null) return code(arg.default)

  const stated = defaultInAbout.exec(arg.about ?? '')
  if (stated) return code(stated[1])

  return arg.value === null && isFlag(arg) ? code('false') : 'none'
}

function argumentAbout(arg) {
  const about = tableText((arg.about ?? '').replace(defaultInAbout, ''))
  return [about, tableText(arg.details)].filter(Boolean).join(' ')
}
