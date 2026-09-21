import path from 'path'
import { SANDBOX_ROOT, isPathInside, normalizeSandboxPath } from './sandbox.js'

export const PERMISSION_DOMAINS = Object.freeze({
  files: {
    id: 'files',
    title: 'Files',
    description: 'Read, create, modify or delete files inside an allowed scope.',
  },
  shell: {
    id: 'shell',
    title: 'Shell & Processes',
    description: 'Run commands, manage processes and perform system-level actions.',
  },
  software: {
    id: 'software',
    title: 'Software',
    description: 'Install software or extend GAI AI with additional executable capabilities.',
  },
  web: {
    id: 'web',
    title: 'Web & Network',
    description: 'Search, fetch or read information from the network.',
  },
  communications: {
    id: 'communications',
    title: 'Messages & Connectors',
    description: 'Send messages or act through connected communication services.',
  },
  memory: {
    id: 'memory',
    title: 'Memory',
    description: 'Read or change long-term personal memory.',
  },
  media: {
    id: 'media',
    title: 'Media',
    description: 'Use speech, image, music, video or other media capabilities.',
  },
  agent: {
    id: 'agent',
    title: 'Agents & Extensions',
    description: 'Delegate work or install/manage agent capabilities.',
  },
  reminders: {
    id: 'reminders',
    title: 'Tasks & Reminders',
    description: 'Create or change reminders, tasks and follow-up work.',
  },
  ui: {
    id: 'ui',
    title: 'Interface',
    description: 'Change GAI AI interface state or transient presentation.',
  },
  security: {
    id: 'security',
    title: 'Security',
    description: 'Change security, authorization or capability policy.',
  },
  other: {
    id: 'other',
    title: 'Other',
    description: 'Capabilities not yet assigned to a dedicated permission domain.',
  },
})

const TOOL_DOMAIN = Object.freeze({
  read_file: 'files',
  list_dir: 'files',
  write_file: 'files',
  delete_file: 'files',
  make_dir: 'files',
  download_file: 'files',

  exec_command: 'shell',
  exec_quick_command: 'shell',
  exec_task_command: 'shell',
  exec_background_command: 'shell',
  kill_process: 'shell',
  list_processes: 'shell',
  terminal_stream: 'shell',

  install_software: 'software',

  web_search: 'web',
  fetch_url: 'web',
  browser_read: 'web',

  send_message: 'communications',
  express: 'communications',
  connect_wechat: 'communications',
  connect_feishu: 'communications',

  search_memory: 'memory',
  probe_memory: 'memory',
  recall_memory: 'memory',
  upsert_memory: 'memory',
  merge_memories: 'memory',
  downgrade_memory: 'memory',

  speak: 'media',
  generate_lyrics: 'media',
  generate_music: 'media',
  generate_image: 'media',
  analyze_image: 'media',
  music: 'media',
  media_mode: 'media',

  delegate_to_agent: 'agent',
  grant_agent_delegation: 'agent',
  install_tool: 'agent',
  uninstall_tool: 'agent',
  manage_tool_factory: 'agent',
  run_capability: 'agent',
  run_api_capability: 'agent',
  manage_api_capability: 'agent',
  find_tool: 'agent',
  list_tools: 'agent',

  schedule_reminder: 'reminders',
  manage_reminder: 'reminders',
  manage_prefetch_task: 'reminders',
  set_task: 'reminders',
  complete_task: 'reminders',
  update_task_step: 'reminders',

  ui_set: 'ui',
  focus_banner: 'ui',
  open_doc_panel: 'ui',
  person_card_mode: 'ui',

  set_security: 'security',
  manage_rule: 'security',
})

export function permissionDomainForTool(name = '') {
  return TOOL_DOMAIN[String(name || '').trim()] || 'other'
}

export function permissionResourceForTool(name = '', args = {}) {
  const tool = String(name || '').trim()
  if (!['read_file', 'list_dir', 'write_file', 'delete_file', 'make_dir', 'download_file'].includes(tool)) {
    return null
  }

  const raw = args.path || args.filename || args.file_path || args.dir || args.directory || args.destination || args.output
  if (!raw) return null

  const normalized = normalizeSandboxPath(String(raw))
  return {
    type: tool === 'list_dir' || tool === 'make_dir' ? 'directory' : 'file',
    path: path.resolve(SANDBOX_ROOT, normalized),
  }
}

export function evaluatePermissionScope(name = '', args = {}, permissionScopes = {}) {
  const domain = permissionDomainForTool(name)
  if (domain !== 'files') {
    return { supported: false, allowed: false, domain, resource: null }
  }

  const resource = permissionResourceForTool(name, args)
  if (!resource) {
    return { supported: true, allowed: false, domain, resource: null }
  }

  const scopes = Array.isArray(permissionScopes?.files)
    ? permissionScopes.files.map(value => path.resolve(String(value))).filter(Boolean)
    : []

  return {
    supported: true,
    allowed: scopes.some(scope => isPathInside(scope, resource.path)),
    domain,
    resource,
    scopes,
  }
}

export function defaultPermissionModeFor({ tool = '', risk = 'medium' } = {}) {
  const domain = permissionDomainForTool(tool)
  if (domain === 'security' || domain === 'software') return 'ask'
  if (['delete_file', 'kill_process', 'install_tool', 'uninstall_tool'].includes(tool)) return 'ask'
  if (risk === 'high') return 'ask'
  return 'policy'
}

export function getPermissionCatalog() {
  return {
    domains: Object.values(PERMISSION_DOMAINS),
    tool_domains: { ...TOOL_DOMAIN },
    modes: [
      { id: 'deny', title: 'Deny' },
      { id: 'ask', title: 'Ask every time' },
      { id: 'once', title: 'Allow once' },
      { id: 'scope', title: 'Allow selected scope' },
      { id: 'always', title: 'Always allow' },
      { id: 'policy', title: 'Follow current policy' },
    ],
  }
}
