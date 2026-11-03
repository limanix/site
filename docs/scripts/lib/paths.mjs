import { fileURLToPath } from 'node:url'

export const catalogDir = fileURLToPath(new URL('../../.catalog/', import.meta.url))
export const referenceDir = fileURLToPath(new URL('../../.reference/', import.meta.url))
export const publicDir = fileURLToPath(new URL('../../pages/public/', import.meta.url))
