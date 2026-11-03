export function region(name, body) {
  if (!body) return ''
  return `<!-- #region ${name} -->\n${body}\n<!-- #endregion ${name} -->\n\n`
}

export function table(header, rows) {
  if (rows.length === 0) return ''
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n')
}

export function definitions(header, records = []) {
  return table(
    header,
    records.map(({ id, what }) => [code(id), tableText(what)]),
  )
}

export function codeBlock(info, body) {
  return `\`\`\`${info}\n${body}\n\`\`\``
}

export function code(text) {
  return `\`${text}\``
}

export function tableText(text) {
  const oneLine = (text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\s*\n\s*/g, ' ')
    .trim()

  return oneLine
    .split(/(`[^`]*`)/)
    .map((part) => (part.startsWith('`') ? part : part.replace(/</g, '&lt;').replace(/>/g, '&gt;')))
    .join('')
}

export function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
