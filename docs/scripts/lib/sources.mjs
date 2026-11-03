import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) })
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`)
  return response
}

export async function latestRelease(repository) {
  const url = `https://github.com/${repository}/releases/latest`
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(60_000) })
  const tag = response.headers.get('location')?.split('/releases/tag/')[1]
  if (!tag) throw new Error(`No latest release: ${response.status} ${url}`)
  return tag
}

export async function readRepositoryFile(localRoot, repository, ref, path) {
  if (localRoot) return readFileSync(join(localRoot, path), 'utf8')

  const response = await download(`https://raw.githubusercontent.com/${repository}/${ref}/${path}`)
  return response.text()
}

export async function readRepositoryJson(localRoot, repository, ref, path) {
  return JSON.parse(await readRepositoryFile(localRoot, repository, ref, path))
}
