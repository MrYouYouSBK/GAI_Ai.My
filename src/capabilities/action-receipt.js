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

function firstValue(args, keys) {
  for (const key of keys) {
    const value = args?.[key]
    if (value !== undefined && value !== null && String(value).trim()) return String(value)
  }
  return ''
}

function classifyOperation(tool = '') {
  if (['read_file', 'list_dir', 'web_search', 'fetch_url', 'browser_read', 'search_memory', 'probe_memory', 'recall_memory', 'list_processes', 'list_tools'].includes(tool)) return 'read'
  if (['write_file', 'make_dir', 'schedule_reminder', 'install_software', 'install_tool'].includes(tool)) return 'create_or_update'
  if (['delete_file', 'uninstall_tool', 'kill_process'].includes(tool)) return 'delete_or_stop'
  if (['send_message', 'express'].includes(tool)) return 'send'
  if (tool.startsWith('exec_') || tool === 'run_capability' || tool === 'run_api_capability') return 'execute'
  if (tool.includes('memory')) return 'memory'
  if (tool.includes('security') || tool === 'manage_rule') return 'security'
  return 'action'
}

function affectedResources(tool = '', args = {}) {
  const resources = []
  const push = (type, locator, label = '') => {
    if (!locator) return
    resources.push({ type, locator: String(locator), label: label || String(locator) })
  }

  if (['read_file', 'write_file', 'delete_file'].includes(tool)) {
    push('file', firstValue(args, ['path', 'filename', 'file_path']))
  } else if (['list_dir', 'make_dir'].includes(tool)) {
    push('directory', firstValue(args, ['path', 'dir', 'directory']))
  } else if (['fetch_url', 'browser_read'].includes(tool)) {
    push('url', firstValue(args, ['url', 'link', 'href']))
  } else if (tool === 'web_search') {
    push('search_query', firstValue(args, ['query', 'q', 'keyword']))
  } else if (['send_message', 'express'].includes(tool)) {
    push('recipient', firstValue(args, ['target_id', 'recipient', 'channel']))
  } else if (tool === 'install_software') {
    push('software', firstValue(args, ['query', 'package_id', 'job_id']))
  } else if (tool === 'kill_process') {
    push('process', firstValue(args, ['pid', 'process_id', 'name']))
  } else if (tool.startsWith('exec_')) {
    push('command', firstValue(args, ['command', 'cmd']).slice(0, 180))
    push('working_directory', firstValue(args, ['cwd']))
  } else if (tool.includes('reminder') || tool.includes('task')) {
    push('task', firstValue(args, ['task', 'title', 'id']))
  } else if (tool.includes('memory')) {
    push('memory', firstValue(args, ['mem_id', 'id', 'query']))
  }

  return resources
}

function reversibility(tool = '', status = 'ok') {
  if (status !== 'ok') {
    return {
      available: false,
      kind: 'not_applied',
      reason: 'The action did not complete successfully.',
    }
  }

  if (['read_file', 'list_dir', 'web_search', 'fetch_url', 'browser_read', 'search_memory', 'probe_memory', 'recall_memory', 'list_processes', 'list_tools'].includes(tool)) {
    return {
      available: false,
      kind: 'read_only',
      reason: 'Read-only actions do not require undo.',
    }
  }

  return {
    available: false,
    kind: 'not_captured',
    reason: 'No verified before-state transaction was captured for this action.',
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
  const parsedArgs = parseArgs(args)
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
    operation: classifyOperation(tool),
    permission: {
      domain: permissionDomain,
      default_mode: defaultPermissionModeFor({ tool, risk }),
      policy_reason: policyReason || '',
    },
    affected: parsedArgs,
    affected_resources: affectedResources(tool, parsedArgs),
    reversible: reversibility(tool, status),
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
