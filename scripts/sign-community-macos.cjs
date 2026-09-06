const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

// electron-builder 25 does not recognize mac.identity='-' as ad-hoc signing.
// Sign the completed bundle with the operating system before ZIP/DMG creation.
module.exports = async context => {
  if (process.env.GAI_COMMUNITY_DISTRIBUTION !== 'true' || context.electronPlatformName !== 'darwin') throw new Error('Community signing hook requires the macOS community channel')
  const app = path.join(context.appOutDir, 'GAI AI.app')
  const binaries = []
  const bundles = []
  const magic = new Set(['feedface', 'cefaedfe', 'feedfacf', 'cffaedfe', 'cafebabe', 'bebafeca', 'cafebabf', 'bfbafeca'])
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) {
        walk(file)
        if (/\.(app|framework|xpc|bundle)$/.test(entry.name)) bundles.push(file)
      } else if (entry.isFile()) {
        const fd = fs.openSync(file, 'r')
        const bytes = Buffer.alloc(4)
        let count
        try { count = fs.readSync(fd, bytes, 0, 4, 0) } finally { fs.closeSync(fd) }
        if (count === 4 && magic.has(bytes.toString('hex'))) binaries.push(file)
      }
    }
  }
  walk(app)
  function sign(file, entitlements) {
    const args = ['--force', '--sign', '-', '--timestamp=none']
    if (entitlements) args.push('--entitlements', path.resolve(entitlements))
    execFileSync('/usr/bin/codesign', [...args, file], { stdio: 'inherit' })
  }
  for (const file of binaries) sign(file)
  // Children precede their containing bundles; helpers receive the same JIT
  // entitlements used by the existing Electron distribution.
  for (const file of bundles) sign(file, file.endsWith('.app') ? 'build/entitlements.mac.inherit.plist' : null)
  sign(app, 'build/entitlements.mac.plist')
  execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', app], { stdio: 'inherit' })
  console.log(`[community-sign] Verified ${binaries.length} Mach-O files and ${bundles.length + 1} bundles`)
}
