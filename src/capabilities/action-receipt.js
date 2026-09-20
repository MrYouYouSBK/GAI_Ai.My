import { defaultPermissionModeFor, permissionDomainForTool } from './permission-center.js'

function parseArgs(value) {
  if (!value) return {}
  if (typeof value === 'object') return value
  try {
    const parsed = JSON.parse(String(value))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function buildActionReceipt({
  id = null,
  tool = '',
  summary = '',
  status = 'ok',
  risk = 'medium',
  source = '',
  timestamp = new Date().toISOString(),
  durationMs = 0,
  args = {},
  resultPreview = '',
  error = '',
  policyReason = '',
} = {}) {
  const permissionDomain = permissionDomainForTool(tool)
  return {
    id,
    timestamp,
    tool,
    summary: summary || tool,
    status,
    risk,
    source,
    duration_ms: Number(durationMs) || 0,
    permission: {
      domain: permissionDomain,
      default_mode: defaultPermissionModeFor({ tool, risk }),
      policy_reason: policyReason || '',
    },
    affected: parseArgs(args),
    result_preview: String(resultPreview || ''),
    error: String(error || ''),
  }
}

export function actionReceiptFromLog(row = {}) {
  return buildActionReceipt({
    id: row.id ?? null,
    timestamp: row.timestamp,
    tool: row.tool,
    summary: row.summary,
    status: row.status,
    risk: row.risk,
    source: row.source,
    durationMs: row.duration_ms,
    args: row.args_json,
    resultPreview: row.result_preview,
    error: row.error,
  })
}
