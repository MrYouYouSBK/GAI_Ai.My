import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, rmSync, existsSync, readdirSync, writeFileSync, copyFileSync } from 'node:fs'
import { tmpdir, homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import updater from '../electron/community-updater.cjs'

if (process.platform !== 'darwin' || process.env.CI !== 'true') throw new Error('Installation test is for isolated macOS CI runners only')
const arch = process.argv[2]
const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
const folder = resolve('dist', `GAI-AI-${version}-Community-Installer-${arch}`)
const installer = join(folder, 'Install-GAI-AI.command')
const archive = `GAI-AI-${version}-mac-${arch}.zip`
const root = mkdtempSync(join(tmpdir(), 'gai-community-test-'))
const env = { ...process.env, BAILONGMA_PORTABLE_DIR: join(root, 'user-data') }
function run(command, args, options = {}) {
  const r = spawnSync(command, args, { encoding: 'utf8', env, ...options })
  assert.equal(r.status, 0, `${command} failed: ${r.stderr || r.stdout}`)
  return r.stdout.trim()
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
function running() { return spawnSync('/usr/bin/pgrep', ['-u', String(process.getuid()), '-x', 'GAI AI']).status === 0 }
async function closeApp() {
  if (!running()) return
  run('/usr/bin/osascript', ['-e', 'tell application id "com.mryouyousbk.gaiai" to quit'])
  for (let i = 0; i < 100 && running(); i++) await delay(100)
  assert.equal(running(), false, 'App did not exit cleanly')
}
async function assertLaunch() {
  for (let i = 0; i < 60 && !running(); i++) await delay(250)
  assert.equal(running(), true, 'Launch Services did not start GAI AI')
  await delay(15000)
  assert.equal(running(), true, 'GAI AI exited within 15 seconds')
}
let target
try {
  // Simulate download quarantine on every extracted installer component.
  run('/usr/bin/xattr', ['-wr', 'com.apple.quarantine', `0083;${Math.floor(Date.now()/1000).toString(16)};Safari;`, folder])
  // bash represents the installer after the user's first OS opening confirmation.
  // This test does not claim to automate Finder's first-run security dialog.
  run('/bin/bash', [installer])
  target = ['/Applications/GAI AI.app', join(homedir(), 'Applications/GAI AI.app')].find(existsSync)
  assert.ok(target, 'Installed app missing')
  assert.equal(run('/usr/bin/xattr', ['-lr', target]).includes('com.apple.quarantine'), false)
  run('/usr/bin/codesign', ['--verify', '--deep', '--strict', target])
  await assertLaunch()
  await closeApp()
  run('/usr/bin/open', [target])
  await assertLaunch()
  await closeApp()
  console.log('PASS: quarantined payload installation, Launch Services start, normal reopen')

  assert.equal(updater.verifyCommunityMacUpdate(target, target, version, arch).community, true)
  assert.throws(() => updater.verifyCommunityMacUpdate(target, target, '999.0.0', arch), /version/)
  assert.throws(() => updater.verifyCommunityMacUpdate(target, target, version, arch === 'arm64' ? 'x64' : 'arm64'), /architecture/)
  assert.throws(() => updater.verifyTrustedMacUpdate(target, target), /Developer ID/)
  console.log('PASS: community update verification; wrong version/architecture and trusted-channel downgrade rejected')

  const corruptFolder = join(root, 'corrupt')
  run('/bin/mkdir', ['-p', corruptFolder])
  copyFileSync(installer, join(corruptFolder, 'Install-GAI-AI.command'))
  writeFileSync(join(corruptFolder, archive), 'corrupt download')
  const failed = spawnSync('/bin/bash', [join(corruptFolder, 'Install-GAI-AI.command')], { env, encoding: 'utf8' })
  assert.notEqual(failed.status, 0)
  assert.match(failed.stderr, /checksum mismatch/)
  assert.ok(existsSync(target), 'Bad download must not modify the installed app')

  run('/bin/bash', [installer])
  await assertLaunch()
  await closeApp()
  assert.ok(readdirSync(join(target, '..')).some(name => name.startsWith('GAI AI.backup-')))
  console.log('PASS: corrupt archive rejected without modifying app; reinstall preserves backup')

  // Execute the real updater from the installed Electron executable so its
  // process.execPath resolves to the installed bundle, then let it quit/restart.
  const updateDriver = join(root, 'update-driver.cjs')
  writeFileSync(updateDriver, `
    const { CommunityMacUpdater, sha256File } = require(${JSON.stringify(resolve('electron/community-updater.cjs'))});
    const app = { getPath: () => ${JSON.stringify(root)}, getVersion: () => ${JSON.stringify(version)} };
    const instance = new CommunityMacUpdater({ app, arch: ${JSON.stringify(arch)}, cacheDir: ${JSON.stringify(join(root, 'update-cache'))} });
    if (!instance.community) throw new Error('Installed app did not opt into community updates');
    const filePath = ${JSON.stringify(join(folder, archive))};
    instance.downloaded = { filePath, version: ${JSON.stringify(version)}, sha256: sha256File(filePath) };
    instance.spawnInstaller();
  `)
  run(join(target, 'Contents', 'MacOS', 'GAI AI'), [updateDriver], { env: { ...env, ELECTRON_RUN_AS_NODE: '1' } })
  await assertLaunch()
  await closeApp()
  run('/usr/bin/codesign', ['--verify', '--deep', '--strict', target])
  console.log('PASS: actual updater replaces installed bundle after exit and reopens app')
} finally {
  await closeApp()
  rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
}
