import { prepareCatalog } from './lib/catalog/prepare.mjs'
import { prepareReference } from './lib/reference/prepare.mjs'

const { MODULES_ROOT, CLIENT_ROOT, LMX_ROOT, ORG_ROOT } = process.env

const catalog = await prepareCatalog({ modulesRoot: MODULES_ROOT })
console.log(
  `Catalog ${catalog.ref}: ${catalog.entries.length} module pages, ` +
    `${catalog.previews.themes.length} themes, ${catalog.previews.prompts.length} prompts`,
)

const { clientRef, lmxRef } = await prepareReference({
  clientRoot: CLIENT_ROOT,
  lmxRoot: LMX_ROOT,
  orgRoot: ORG_ROOT,
})
console.log(`Reference: client ${clientRef}, lmx ${lmxRef}`)
