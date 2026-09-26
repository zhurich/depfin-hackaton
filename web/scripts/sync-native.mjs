// Копирует web/dist в assets Android и в FinniPet/www для iOS.
import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(webRoot, '..')
const dist = join(webRoot, 'dist')

const TARGETS = [
  { platform: 'Android', path: join(repoRoot, 'android', 'app', 'src', 'main', 'assets', 'www') },
  { platform: 'iOS', path: join(repoRoot, 'ios', 'FinniPet', 'www') },
]

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

if (!(await exists(join(dist, 'index.html')))) {
  console.error(
    [
      '',
      `Не найден собранный веб-слой: ${join(dist, 'index.html')}`,
      '',
      'Сначала соберите его:',
      '    npm run build',
      '',
    ].join('\n'),
  )
  process.exit(1)
}

for (const target of TARGETS) {
  await rm(target.path, { recursive: true, force: true })
  await mkdir(dirname(target.path), { recursive: true })
  await cp(dist, target.path, { recursive: true })
  console.log(`${target.platform}: ${target.path}`)
}
