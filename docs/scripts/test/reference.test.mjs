import assert from 'node:assert/strict'
import test from 'node:test'
import { renderCli, renderLmx } from '../lib/reference/commands.mjs'
import { renderConfig } from '../lib/reference/config.mjs'

const arg = (fields) => ({
  short: null,
  value: null,
  required: false,
  default: null,
  values: [],
  details: null,
  ...fields,
})

const field = (fields) => ({
  choices: [],
  default: null,
  required: false,
  example: null,
  ...fields,
})

const client = {
  commands: [
    {
      name: 'limanix network check',
      usage: 'limanix network check NAME PORT [flags]',
      about: 'Check why a guest port may be unreachable from the Mac.',
      details: null,
      args: [
        arg({ name: '--udp', about: 'Check a UDP port instead of a TCP one.' }),
        arg({ name: '--quiet', short: '-q', about: 'Print only names' }),
        arg({ name: '--config', value: 'string', about: 'Path to the configuration file.' }),
      ],
      checks: [
        { id: 'vm', what: 'The VM runs.' },
        { id: 'address', what: 'The guest has an address.' },
        { id: 'guest', what: 'Takes the place of the guest checks.' },
        { id: 'connect', what: 'The Mac connects.' },
      ],
    },
  ],
  config: [
    field({ key: 'name', type: 'string', default: '"example-box"', doc: 'VM name.' }),
    field({ key: 'resources', type: 'table', doc: 'Resources.' }),
    field({
      key: 'resources.arch',
      type: 'string',
      choices: ['arm64', 'amd64'],
      doc: "Guest architecture; the Mac's own by default.",
    }),
    field({ key: 'env', type: 'table[string, string]', default: '{}', doc: 'Environment.' }),
    field({ key: 'mounts', type: 'array of tables', default: '[]', doc: 'Shared folders.' }),
    field({
      key: 'mounts[].mode',
      type: 'string',
      choices: ['rw', 'ro', 'none'],
      default: '"rw"',
      doc: 'Mount access',
    }),
    field({ key: 'mounts[].source', type: 'string', required: true, doc: 'Host directory.' }),
  ],
  example: '# Example\nname = "example-box"\n',
}

const lmx = {
  commands: [
    {
      name: 'lmx net check',
      about: 'Check the network',
      details: null,
      args: [
        arg({ name: 'PORT', value: 'PORT', required: true, about: 'Port to check' }),
        arg({ name: '--timeout', value: 'TIMEOUT', about: 'Longest wait [default: 10m]' }),
        arg({
          name: 'KIND',
          value: 'KIND',
          required: true,
          about: 'Kind of task',
          values: [{ name: 'apply', about: 'Builds' }],
        }),
      ],
      checks: [
        { id: 'firewall', what: 'The firewall opens the port' },
        { id: 'listener', what: 'Something listens' },
      ],
    },
  ],
}

test('flags take their type and default from the argument', () => {
  const rows = tableRows(renderCli(client, lmx), 'limanix-network-check')
  assert.deepEqual(rows, [
    '| `--udp` | boolean | `false` | Check a UDP port instead of a TCP one. |',
    '| `-q`, `--quiet` | boolean | `false` | Print only names |',
    '| `--config` | string | none | Path to the configuration file. |',
  ])
})

test('the guest checks of lmx come before the client check that replaces them', () => {
  const ids = tableRows(renderCli(client, { commands: [] }), 'limanix-network-check-checks').map(
    (row) => row.split('`')[1],
  )
  assert.deepEqual(ids, ['vm', 'address', 'guest', 'connect'])
  const merged = tableRows(renderCli(client, lmx), 'limanix-network-check-checks').map(
    (row) => row.split('`')[1],
  )
  assert.deepEqual(merged, ['vm', 'address', 'firewall', 'listener', 'guest', 'connect'])
})

test('lmx arguments show positional ones as required and a stated default in its column', () => {
  const rows = tableRows(renderLmx(lmx), 'lmx-net-check')
  assert.deepEqual(rows.slice(0, 2), [
    '| `PORT` | required | Port to check |',
    '| `--timeout` | `10m` | Longest wait |',
  ])
  const rendered = renderLmx(lmx)
  assert.match(rendered, /<!-- #region lmx-net-check-values -->\n\| Value of `KIND` \| Meaning \|/)
  assert.match(rendered, /\| `firewall` \| The firewall opens the port \|/)
})

test('configuration tables list the keys of one table with choices and defaults', () => {
  const config = renderConfig(client)
  assert.deepEqual(tableRows(config, 'config-top'), [
    '| `name` | string | `"example-box"` | VM name. |',
    '| `env` | table[string, string] | `{}` | Environment. |',
    '| `mounts` | array of tables | `[]` | Shared folders. |',
  ])
  assert.deepEqual(tableRows(config, 'config-resources'), [
    '| `arch` | `"arm64"` or `"amd64"` | — | Guest architecture; the Mac\'s own by default. |',
  ])
  assert.deepEqual(tableRows(config, 'config-mounts'), [
    '| `mode` | `"rw"`, `"ro"` or `"none"` | `"rw"` | Mount access |',
    '| `source` | string | required | Host directory. |',
  ])
})

test('every command and table gets a region named by its slug', () => {
  const cli = renderCli(client, lmx)
  for (const name of [
    'limanix-network-check-about',
    'limanix-network-check',
    'limanix-network-check-checks',
  ]) {
    assert.match(
      cli,
      new RegExp(`<!-- #region ${name} -->\\n[\\s\\S]*?\\n<!-- #endregion ${name} -->`),
    )
  }
  const config = renderConfig(client)
  for (const name of ['config-top', 'config-resources', 'config-mounts', 'config-example']) {
    assert.match(config, new RegExp(`<!-- #region ${name} -->`))
  }
  assert.match(config, /```toml \[limanix\.toml\]\n# Example\nname = "example-box"\n```/)
})

test('angle brackets outside code cannot open an element on the page', () => {
  const fields = [
    field({
      key: 'root',
      type: 'string',
      default: '""',
      doc: 'Host root <root>/<name>; keeps `<code>`',
    }),
  ]
  assert.deepEqual(tableRows(renderConfig({ ...client, config: fields }), 'config-top'), [
    '| `root` | string | `""` | Host root &lt;root&gt;/&lt;name&gt;; keeps `<code>` |',
  ])
})

test('renderers preserve source punctuation and ignore additional metadata', () => {
  const extendedClient = {
    ...client,
    metadata: { version: 2 },
    commands: client.commands.map((command) => ({
      ...command,
      metadata: 'unused',
      about: 'Check the network;',
      args: command.args.map((argument) => ({ ...argument, metadata: 'unused' })),
    })),
  }
  const rendered = renderCli(extendedClient, { ...lmx, metadata: 'unused' })
  assert.match(rendered, /<!-- #region limanix-network-check-about -->\nCheck the network;\n/)
  assert.doesNotMatch(rendered, /Check the network;\./)
  assert.match(rendered, /\| `-q`, `--quiet` \| boolean \| `false` \| Print only names \|/)
  assert.equal(renderLmx({ ...lmx, metadata: 'unused' }), renderLmx(lmx))
  assert.equal(renderConfig({ ...client, metadata: 'unused' }), renderConfig(client))
})

test('configuration update values come from the source without a local rule list', () => {
  const config = renderConfig({
    ...client,
    config: [
      field({ key: 'example', type: 'string', doc: 'Example field', update: 'future-rule' }),
    ],
  })

  assert.deepEqual(tableRows(config, 'config-update'), ['| `example` | `future-rule` |'])
  assert.deepEqual(tableRows(config, 'config-top'), ['| `example` | string | — | Example field |'])
})

function tableRows(markdown, region) {
  const body = markdown.match(
    new RegExp(`<!-- #region ${region} -->\\n([\\s\\S]*?)\\n<!-- #endregion ${region} -->`),
  )?.[1]
  assert.ok(body, `Missing reference region: ${region}`)
  return body.split('\n').slice(2)
}
