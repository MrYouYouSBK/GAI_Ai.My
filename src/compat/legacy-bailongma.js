// Legacy BaiLongma compatibility boundary.
//
// New production modules should import these helpers instead of reading old
// environment/global names directly. Keep all old identifiers isolated here
// until the migration window can be retired safely.

export function getCompatibleUserDirEnv() {
  return process.env.GAI_USER_DIR || process.env.BAILONGMA_USER_DIR || ''
}

export function getCompatibleResourcesDirEnv() {
  return process.env.GAI_RESOURCES_DIR || process.env.BAILONGMA_RESOURCES_DIR || ''
}

export function getCompatiblePortEnv() {
  return process.env.GAI_PORT || process.env.BAILONGMA_PORT || ''
}

export function getStartupProgressReporter() {
  return globalThis.gaiStartupProgress || globalThis.bailongmaStartupProgress
}

export function getWindowLayoutSnapshotReader() {
  return globalThis.gaiWindowLayoutSnapshot || globalThis.getGaiWindowLayoutSnapshot
    || globalThis.getBailongmaWindowLayoutSnapshot
}
