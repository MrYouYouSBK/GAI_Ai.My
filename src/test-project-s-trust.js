import assert from 'node:assert/strict'
import {
  defaultPermissionModeFor,
  getPermissionCatalog,
  permissionDomainForTool,
} from './capabilities/permission-center.js'
import { actionReceiptFromLog, buildActionReceipt } from './capabilities/action-receipt.js'

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

console.log('test-project-s-trust passed')
