import assert from 'node:assert/strict'
import {
  defaultPermissionModeFor,
  getPermissionCatalog,
  permissionDomainForTool,
} from './capabilities/permission-center.js'
import { actionReceiptFromLog, buildActionReceipt } from './capabilities/action-receipt.js'
import {
  listPendingPermissionRequests,
  requestToolPermission,
  resolvePermissionRequest,
} from './capabilities/permission-requests.js'
import {
  getCompatiblePortEnv,
  getCompatibleResourcesDirEnv,
  getCompatibleUserDirEnv,
} from './compat/legacy-bailongma.js'
import {
  getDesktopBridge,
  getVoiceBridge,
  installVoiceBridge,
  readUiStorage,
  readVoiceSilenceMs,
  storageKey,
  writeUiStorage,
} from './ui/brain-ui/legacy-compat.js'

assert.equal(permissionDomainForTool('read_file'), 'files')
assert.equal(permissionDomainForTool('exec_command'), 'shell')
assert.equal(permissionDomainForTool('install_software'), 'software')
assert.equal(permissionDomainForTool('send_message'), 'communications')
assert.equal(permissionDomainForTool('unknown_future_tool'), 'other')

assert.equal(defaultPermissionModeFor({ tool: 'install_software', risk: 'high' }), 'ask')
assert.equal(defaultPermissionModeFor({ tool: 'delete_file', risk: 'high' }), 'ask')
assert.equal(defaultPermissionModeFor({ tool: 'read_file', risk: 'low' }), 'policy')

const catalog = getPermissionCatalog()
assert.ok(catalog.domains.some(domain => domain.id === 'files'))
assert.ok(catalog.domains.some(domain => domain.id === 'security'))
assert.ok(catalog.modes.some(mode => mode.id === 'deny'))
assert.ok(catalog.modes.some(mode => mode.id === 'always'))

const receipt = buildActionReceipt({
  tool: 'exec_command',
  summary: 'exec_command(echo hello)',
  status: 'ok',
  risk: 'high',
  source: 'llm',
  durationMs: 12,
  args: { command: 'echo hello' },
})
assert.equal(receipt.permission.domain, 'shell')
assert.equal(receipt.permission.default_mode, 'ask')
assert.equal(receipt.status, 'ok')
assert.deepEqual(receipt.affected, { command: 'echo hello' })

const persisted = actionReceiptFromLog({
  id: 7,
  timestamp: '2026-09-20T00:00:00.000Z',
  tool: 'write_file',
  summary: 'write_file(test.md)',
  status: 'ok',
  risk: 'medium',
  source: 'llm',
  duration_ms: 8,
  args_json: '{"path":"test.md"}',
  result_preview: 'ok',
  error: '',
})
assert.equal(persisted.id, 7)
assert.equal(persisted.permission.domain, 'files')
assert.deepEqual(persisted.affected, { path: 'test.md' })

// GAI names must win, while old environment names still migrate existing users.
const previousEnv = {
  GAI_USER_DIR: process.env.GAI_USER_DIR,
  BAILONGMA_USER_DIR: process.env.BAILONGMA_USER_DIR,
  GAI_RESOURCES_DIR: process.env.GAI_RESOURCES_DIR,
  BAILONGMA_RESOURCES_DIR: process.env.BAILONGMA_RESOURCES_DIR,
  GAI_PORT: process.env.GAI_PORT,
  BAILONGMA_PORT: process.env.BAILONGMA_PORT,
}
try {
  delete process.env.GAI_USER_DIR
  process.env.BAILONGMA_USER_DIR = '/legacy/user'
  assert.equal(getCompatibleUserDirEnv(), '/legacy/user')
  process.env.GAI_USER_DIR = '/gai/user'
  assert.equal(getCompatibleUserDirEnv(), '/gai/user')

  delete process.env.GAI_RESOURCES_DIR
  process.env.BAILONGMA_RESOURCES_DIR = '/legacy/resources'
  assert.equal(getCompatibleResourcesDirEnv(), '/legacy/resources')
  process.env.GAI_RESOURCES_DIR = '/gai/resources'
  assert.equal(getCompatibleResourcesDirEnv(), '/gai/resources')

  delete process.env.GAI_PORT
  process.env.BAILONGMA_PORT = '3999'
  assert.equal(getCompatiblePortEnv(), '3999')
  process.env.GAI_PORT = '3721'
  assert.equal(getCompatiblePortEnv(), '3721')
} finally {
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

const storageData = new Map([['bailongma-voice-silence-ms', '2500']])
const fakeStorage = {
  getItem(key) { return storageData.has(key) ? storageData.get(key) : null },
  setItem(key, value) { storageData.set(key, String(value)) },
}
assert.equal(readVoiceSilenceMs(fakeStorage), 2500)
assert.equal(storageData.get('gai.voice.silence-ms'), '2500')
storageData.set('gai.voice.silence-ms', '1800')
assert.equal(readVoiceSilenceMs(fakeStorage), 1800)

// Generic UI migration: old values seed new GAI keys, then GAI keys win.
const uiStorageData = new Map([['bailongma_ui_zoom_factor', '1.25']])
const uiStorage = {
  getItem(key) { return uiStorageData.has(key) ? uiStorageData.get(key) : null },
  setItem(key, value) { uiStorageData.set(key, String(value)) },
  removeItem(key) { uiStorageData.delete(key) },
}
assert.equal(storageKey('uiZoom', uiStorage), 'gai.ui-zoom-factor')
assert.equal(readUiStorage('uiZoom', '1.0', uiStorage), '1.25')
assert.equal(uiStorageData.get('gai.ui-zoom-factor'), '1.25')
writeUiStorage('uiZoom', '1.4', uiStorage)
assert.equal(readUiStorage('uiZoom', '1.0', uiStorage), '1.4')
assert.equal(uiStorageData.get('bailongma_ui_zoom_factor'), '1.25')

// New GAI global names win; legacy aliases remain readable during migration.
const legacyDesktop = { source: 'legacy' }
const gaiDesktop = { source: 'gai' }
assert.equal(getDesktopBridge({ bailongma: legacyDesktop }), legacyDesktop)
assert.equal(getDesktopBridge({ gai: gaiDesktop, bailongma: legacyDesktop }), gaiDesktop)

const scope = {}
const voiceApi = { isActive: () => true }
installVoiceBridge(voiceApi, scope)
assert.equal(scope.gaiVoice, voiceApi)
assert.equal(scope.bailongmaVoice, voiceApi)
assert.equal(getVoiceBridge(scope), voiceApi)

// Ask Every Time broker pauses until a one-time decision arrives.
const approvalPromise = requestToolPermission({
  tool: 'write_file',
  args: { path: 'example.txt', content: 'hello' },
  policy: { risk: 'medium', permissionDomain: 'files' },
  context: { source: 'test' },
  timeoutMs: 5_000,
})
const pendingApproval = listPendingPermissionRequests().find(item => item.tool === 'write_file')
assert.ok(pendingApproval)
assert.equal(pendingApproval.domain, 'files')
assert.equal(resolvePermissionRequest(pendingApproval.id, 'allow_once').ok, true)
const approval = await approvalPromise
assert.equal(approval.decision, 'allow_once')
assert.equal(listPendingPermissionRequests().some(item => item.id === pendingApproval.id), false)

const denyPromise = requestToolPermission({
  tool: 'delete_file',
  args: { path: 'example.txt' },
  policy: { risk: 'high', permissionDomain: 'files' },
  context: { source: 'test' },
  timeoutMs: 5_000,
})
const pendingDeny = listPendingPermissionRequests().find(item => item.tool === 'delete_file')
assert.ok(pendingDeny)
assert.equal(resolvePermissionRequest(pendingDeny.id, 'deny').ok, true)
assert.equal((await denyPromise).decision, 'deny')

console.log('test-project-s-trust passed')
