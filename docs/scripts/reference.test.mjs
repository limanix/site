import assert from 'node:assert/strict'
import test from 'node:test'
import {
  argumentsTable,
  checksTable,
  configTable,
  flagsTable,
  renderCli,
  renderConfig,
  renderLmx,
  slug,
} from './reference.mjs'

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
  const rows = flagsTable(client.commands[0]).split('\n').slice(2)
  assert.deepEqual(rows, [
    '| `--udp` | boolean | `false` | Check a UDP port instead of a TCP one. |',
    '| `-q`, `--quiet` | boolean | `false` | Print only names. |',
    '| `--config` | string | none | Path to the configuration file. |',
  ])
})

test('the guest checks of lmx come before the client check that replaces them', () => {
  const ids = checksTable(client.commands[0], { commands: [] })
    .split('\n')
    .slice(2)
    .map((row) => row.split('`')[1])
  assert.deepEqual(ids, ['vm', 'address', 'guest', 'connect'])
  const merged = checksTable(
    { ...client.commands[0], name: 'limanix network check' },
    { commands: [{ ...lmx.commands[0], name: 'lmx net check' }] },
  )
    .split('\n')
    .slice(2)
    .map((row) => row.split('`')[1])
  assert.deepEqual(merged, ['vm', 'address', 'firewall', 'listener', 'guest', 'connect'])
})

test('lmx arguments show positional ones as required and a stated default in its column', () => {
  const rows = argumentsTable(lmx.commands[0]).split('\n').slice(2)
  assert.deepEqual(rows.slice(0, 2), [
    '| `PORT` | required | Port to check. |',
    '| `--timeout` | `10m` | Longest wait. |',
  ])
  const rendered = renderLmx(lmx)
  assert.match(rendered, /<!-- #region lmx-net-check-values -->\n\| Value of `KIND` \| Meaning \|/)
  assert.match(rendered, /\| `firewall` \| The firewall opens the port\. \|/)
})

test('configuration tables list the keys of one table with choices and defaults', () => {
  assert.deepEqual(configTable(client.config, '').split('\n').slice(2), [
    '| `name` | string | `"example-box"` | VM name. |',
    '| `env` | table[string, string] | `{}` | Environment. |',
    '| `mounts` | array of tables | `[]` | Shared folders. |',
  ])
  assert.deepEqual(configTable(client.config, 'resources').split('\n').slice(2), [
    '| `arch` | `"arm64"` or `"amd64"` | — | Guest architecture; the Mac\'s own by default. |',
  ])
  assert.deepEqual(configTable(client.config, 'mounts[]').split('\n').slice(2), [
    '| `mode` | `"rw"`, `"ro"` or `"none"` | `"rw"` | Mount access. |',
    '| `source` | string | required | Host directory. |',
  ])
})

test('every command and table gets a region named by its slug', () => {
  assert.equal(slug('limanix network check'), 'limanix-network-check')
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
  assert.deepEqual(configTable(fields, '').split('\n').slice(2), [
    '| `root` | string | `""` | Host root &lt;root&gt;/&lt;name&gt;; keeps `<code>`. |',
  ])
})
