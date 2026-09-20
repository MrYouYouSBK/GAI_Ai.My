// Electron-side compatibility boundary for pre-GAI environment names.
// Keep legacy aliases here so the rest of the desktop bootstrap uses GAI names.

function readPortableDir() {
  return (process.env.GAI_PORTABLE_DIR || process.env.BAILONGMA_PORTABLE_DIR || '').trim()
}

function publishUserDir(userDir) {
  process.env.GAI_USER_DIR ||= userDir
  process.env.BAILONGMA_USER_DIR ||= userDir
}

function publishBackendEnvironment({ userDir, resourcesDir, port }) {
  process.env.GAI_USER_DIR ||= userDir
  process.env.GAI_RESOURCES_DIR ||= resourcesDir
  process.env.GAI_PORT ||= String(port)

  // Backward compatibility for bundled modules/configs from older releases.
  process.env.BAILONGMA_USER_DIR ||= userDir
  process.env.BAILONGMA_RESOURCES_DIR ||= resourcesDir
  process.env.BAILONGMA_PORT ||= String(port)
}

module.exports = {
  publishBackendEnvironment,
  publishUserDir,
  readPortableDir,
}
