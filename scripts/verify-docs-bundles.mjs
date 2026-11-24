import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const adapterEntries = ['index.html', 'articles/getting-started.html', 'api/MirrorPulse.Adapter.Sdk.html']

function countFiles(directory) {
  return readdirSync(directory).reduce((count, entry) => {
    const path = join(directory, entry)
    return count + (statSync(path).isDirectory() ? countFiles(path) : 1)
  }, 0)
}

function verifyBundle(project, required, manifest) {
  const root = join(process.cwd(), 'dist', project)
  for (const path of required) {
    const bytes = readFileSync(join(root, path))
    if (manifest) {
      const files = manifest.files.filter(file => file.path === path)
      const hash = createHash('sha256').update(bytes).digest('hex')
      if (files.length !== 1 || files[0].bytes !== bytes.length || files[0].sha256.toLowerCase() !== hash) {
        throw new Error(`The ${project} bundle does not match its manifest at ${path}`)
      }
    }
  }
  console.log(`Verified ${relative(process.cwd(), root)} (${countFiles(root)} files)`)
}

const manifest = JSON.parse(readFileSync(join('dist', 'adapter', 'manifest.json'), 'utf8'))
if (manifest.contentRoot !== 'adapter' || !Array.isArray(manifest.files)) {
  throw new Error('The Adapter documentation manifest is invalid')
}
verifyBundle('cfsharp', ['index.html'])
verifyBundle('adapter', adapterEntries, manifest)
