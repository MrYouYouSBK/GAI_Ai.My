import crypto from 'crypto'
import { emitEvent } from '../events.js'
import { permissionDomainForTool } from './permission-center.js'
import { redactAuditValue, summarizeToolExecution } from './tool-audit.js'

const pending = new Map()
const DEFAULT_TIMEOUT_MS = 60_000

function publicRequest(entry) {
  return {
    id: entry.id,
    created_at: entry.createdAt,
    expires_at: entry.expiresAt,
    tool: entry.tool,
    domain: entry.domain,
    risk: entry.risk,
    summary: entry.summary,
    args: entry.args,
    source: entry.source,
  }
}

export function listPendingPermissionRequests() {
  return [...pending.values()]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(publicRequest)
}

export function requestToolPermission({
  tool,
  args = {},
  policy = {},
  context = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const safeArgs = redactAuditValue(args)
  const duration = Math.min(5 * 60_000, Math.max(5_000, Number(timeoutMs) || DEFAULT_TIMEOUT_MS))
  const expiresAt = new Date(Date.now() + duration).toISOString()
  const entry = {
    id,
    createdAt,
    expiresAt,
    tool: String(tool || ''),
    domain: policy.permissionDomain || permissionDomainForTool(tool),
    risk: policy.risk || 'medium',
    summary: summarizeToolExecution(tool, safeArgs),
    args: safeArgs,
    source: context.source || context.trigger || (context.autonomous ? 'autonomous' : 'llm'),
    resolve: null,
    timer: null,
  }

  const promise = new Promise(resolve => {
    entry.resolve = resolve
    entry.timer = setTimeout(() => {
      if (!pending.delete(id)) return
      const response = { id, decision: 'timeout', request: publicRequest(entry) }
      emitEvent('permission_request_resolved', response)
      resolve(response)
    }, duration)
  })

  pending.set(id, entry)
  emitEvent('permission_request_created', publicRequest(entry))
  return promise
}

export function resolvePermissionRequest(id, decision) {
  const key = String(id || '').trim()
  const normalized = String(decision || '').trim().toLowerCase()
  if (!['allow_once', 'deny'].includes(normalized)) {
    return { ok: false, error: 'decision must be allow_once or deny' }
  }

  const entry = pending.get(key)
  if (!entry) return { ok: false, error: 'permission request not found or expired' }

  pending.delete(key)
  clearTimeout(entry.timer)
  const response = {
    id: key,
    decision: normalized,
    request: publicRequest(entry),
  }
  emitEvent('permission_request_resolved', response)
  entry.resolve(response)
  return { ok: true, ...response }
}

export function clearPendingPermissionRequests(reason = 'cancelled') {
  for (const [id, entry] of pending.entries()) {
    pending.delete(id)
    clearTimeout(entry.timer)
    const response = { id, decision: reason, request: publicRequest(entry) }
    emitEvent('permission_request_resolved', response)
    entry.resolve(response)
  }
}
