import fs from 'fs'

const auditPath = process.argv[2] || 'npm-audit.json'
const reportPath = process.argv[3] || 'security-audit-summary.md'

const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'))
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const runtimeDirect = new Set(Object.keys(pkg.dependencies || {}))
const devDirect = new Set(Object.keys(pkg.devDependencies || {}))
const severityRank = { critical: 5, high: 4, moderate: 3, low: 2, info: 1 }

function fixLabel(value) {
  if (value === false || value == null) return 'No automated fix'
  if (value === true) return 'Automated fix available'
  if (typeof value === 'object') {
    const target = value.name ? `${value.name}@${value.version || '?'}` : (value.version || 'available')
    return value.isSemVerMajor ? `Major upgrade: ${target}` : `Upgrade: ${target}`
  }
  return String(value)
}

function viaLabel(via = []) {
  return via.slice(0, 4).map(item => {
    if (typeof item === 'string') return item
    return item?.title || item?.name || item?.source || 'advisory'
  }).join('; ')
}

const rows = Object.values(audit.vulnerabilities || {}).map(vuln => ({
  name: vuln.name,
  severity: vuln.severity || 'unknown',
  direct: vuln.isDirect === true || runtimeDirect.has(vuln.name) || devDirect.has(vuln.name),
  scope: runtimeDirect.has(vuln.name) ? 'runtime' : devDirect.has(vuln.name) ? 'dev' : 'transitive',
  range: vuln.range || '',
  fix: fixLabel(vuln.fixAvailable),
  via: viaLabel(vuln.via),
})).sort((a, b) =>
  Number(b.direct) - Number(a.direct)
  || (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0)
  || a.name.localeCompare(b.name)
)

const counts = audit.metadata?.vulnerabilities || {}
const directCriticalHigh = rows.filter(row => row.direct && ['critical', 'high'].includes(row.severity))
const transitiveCriticalHigh = rows.filter(row => !row.direct && ['critical', 'high'].includes(row.severity))

const lines = [
  '# GAI AI Dependency Security Baseline',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Summary',
  '',
  `- Critical: ${counts.critical || 0}`,
  `- High: ${counts.high || 0}`,
  `- Moderate: ${counts.moderate || 0}`,
  `- Low: ${counts.low || 0}`,
  `- Direct critical/high packages: ${directCriticalHigh.length}`,
  `- Transitive critical/high packages: ${transitiveCriticalHigh.length}`,
  '',
  'This report is observational in Foundation REV.01. It does not use `npm audit fix --force` and does not silently accept breaking dependency upgrades.',
  '',
  '## Findings',
  '',
  '| Package | Severity | Scope | Vulnerable range | Fix | Via |',
  '|---|---|---|---|---|---|',
  ...rows.map(row =>
    `| ${row.name} | ${row.severity} | ${row.scope} | ${String(row.range).replaceAll('|', '\\|')} | ${String(row.fix).replaceAll('|', '\\|')} | ${String(row.via).replaceAll('|', '\\|')} |`
  ),
  '',
  '## Remediation order',
  '',
  '1. Direct runtime critical/high findings.',
  '2. Direct development/build-chain critical/high findings.',
  '3. Transitive critical/high findings with non-breaking parent upgrades.',
  '4. Breaking upgrades only after build, signing, updater and installer regression tests.',
  '',
]

fs.writeFileSync(reportPath, lines.join('\n') + '\n')

console.log(`[security-audit] total=${rows.length} critical=${counts.critical || 0} high=${counts.high || 0} moderate=${counts.moderate || 0} low=${counts.low || 0}`)
console.log(`[security-audit] direct critical/high=${directCriticalHigh.length}; transitive critical/high=${transitiveCriticalHigh.length}`)
for (const row of rows.filter(row => ['critical', 'high'].includes(row.severity))) {
  console.log(`[security-audit] ${row.severity.toUpperCase()} ${row.scope} ${row.name} ${row.range} -> ${row.fix}`)
}
