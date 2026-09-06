import { readFileSync, writeFileSync, mkdirSync, copyFileSync, chmodSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const arch = process.argv[2]
if (!['arm64', 'x64'].includes(arch) || process.platform !== 'darwin') throw new Error('Run on macOS with arm64 or x64')
const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
const archive = `GAI-AI-${version}-mac-${arch}.zip`
const digest = createHash('sha256').update(readFileSync(join('dist', archive))).digest('hex')
const folder = resolve('dist', `GAI-AI-${version}-Community-Installer-${arch}`)
mkdirSync(folder, { recursive: true })
copyFileSync(join('dist', archive), join(folder, archive))
let script = readFileSync('scripts/macos/Install-GAI-AI.command', 'utf8')
for (const [key, value] of Object.entries({ ARCHIVE: archive, SHA256: digest, VERSION: version, ARCH: arch })) script = script.replaceAll(`@@${key}@@`, value)
const installer = join(folder, 'Install-GAI-AI.command')
writeFileSync(installer, script)
chmodSync(installer, 0o755)
writeFileSync(join(folder, 'READ-ME.txt'), `GAI AI ${version} — ${arch}\n\n1. Extract this entire folder.\n2. Double-click Install-GAI-AI.command. No Terminal command or sudo is required.\n3. If macOS blocks this first run, open System Settings > Privacy & Security > Open Anyway and confirm.\n4. The installer checks the archive and bundle, keeps your previous app, installs and launches GAI AI.\n5. Open GAI AI normally from Applications afterwards. If /Applications is not writable, it uses your home Applications folder.\n\n這是無需 Apple Developer 帳號的社群版本，未經 Apple 公證。\n解壓縮整個資料夾，雙擊 Install-GAI-AI.command；不必手動輸入任何指令。\n第一次若被系統阻擋：系統設定 > 隱私權與安全性 > 仍要打開，確認執行。\n安裝器只處理驗證過的 GAI AI，保留旧版與使用者資料，不會停用系統安全設定。\n\nBuilt from: ${process.env.GITHUB_SHA || 'local'}\nSHA-256 (${archive}): ${digest}\n`)
execFileSync('/usr/bin/ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', folder, `${folder}.zip`], { stdio: 'inherit' })
console.log(`Created ${folder}.zip`)
