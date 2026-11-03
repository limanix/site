import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { referenceDir } from '../paths.mjs'
import { latestRelease, readRepositoryFile, readRepositoryJson } from '../sources.mjs'
import { renderCli, renderLmx } from './commands.mjs'
import { renderConfig } from './config.mjs'
import { region } from './markdown.mjs'

export async function prepareReference({ clientRoot, lmxRoot, orgRoot }) {
  const clientRef = clientRoot ? 'local' : await latestRelease('limanix/client')
  const client = await readRepositoryJson(clientRoot, 'limanix/client', clientRef, 'reference.json')

  let lmxRef = 'local'
  if (!lmxRoot) {
    const pin = await readRepositoryJson(
      clientRoot,
      'limanix/client',
      clientRef,
      'internal/nixos/resources/base/lmx.json',
    )
    lmxRef = `v${pin.version}`
  }

  const lmx = await readRepositoryJson(lmxRoot, 'limanix/lmx', lmxRef, 'reference.json')
  const guide = await readRepositoryFile(orgRoot, 'limanix/.github', 'main', 'CONTRIBUTING.md')

  mkdirSync(referenceDir, { recursive: true })
  writeFileSync(join(referenceDir, 'cli.md'), renderCli(client, lmx))
  writeFileSync(join(referenceDir, 'config.md'), renderConfig(client))
  writeFileSync(join(referenceDir, 'lmx.md'), renderLmx(lmx))
  writeFileSync(
    join(referenceDir, 'contributing.md'),
    region('contributing', guide.replaceAll('](https://docs.limanix.dev/', '](/')),
  )

  return { clientRef, lmxRef }
}
