/**
 * Report Generator — transforms correlated OSINT data into a structured report.
 */

import type { CorrelatedData } from './correlationEngine'

export interface InvestigationReport {
  generatedAt: string
  target: string
  targetType: string
  riskLevel: 'GREEN' | 'YELLOW' | 'RED'
  riskScore: number
  sections: ReportSection[]
}

export interface ReportSection {
  id: string
  title: string
  icon: string
  content: string
  items?: string[]
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical'
}

export function generateReport(data: CorrelatedData): InvestigationReport {
  const sections: ReportSection[] = []

  // ─── Executive Summary ───
  const riskEmoji = data.riskLevel === 'RED' ? '[RED]' : data.riskLevel === 'YELLOW' ? '[YELLOW]' : '[GREEN]'
  sections.push({
    id: 'executive-summary',
    title: 'Executive Summary',
    icon: '',
    content: `${riskEmoji} ${data.riskLevel} RISK (Score: ${data.riskScore}/100) - ${data.summary}`,
    severity: data.riskLevel === 'RED' ? 'critical' : data.riskLevel === 'YELLOW' ? 'medium' : 'info'
  })

  // ─── Target Profile ───
  const profileItems: string[] = [
    `Type: ${data.targetType.toUpperCase()}`,
    `Target: ${data.target}`,
  ]
  if (data.domains.length > 0) profileItems.push(`Domains: ${data.domains.slice(0, 5).join(', ')}${data.domains.length > 5 ? ` (+${data.domains.length - 5} more)` : ''}`)
  if (data.ips.length > 0) profileItems.push(`IPs: ${data.ips.slice(0, 5).join(', ')}${data.ips.length > 5 ? ` (+${data.ips.length - 5} more)` : ''}`)
  if (data.emails.length > 0) profileItems.push(`Emails: ${data.emails.join(', ')}`)
  if (data.usernames.length > 0) profileItems.push(`Usernames: ${data.usernames.join(', ')}`)

  sections.push({
    id: 'target-profile',
    title: 'Target Profile',
    icon: '',
    content: `Investigation target identified as ${data.targetType}`,
    items: profileItems
  })

  // ─── Key Findings ───
  if (data.findings.length > 0) {
    const sortedFindings = [...data.findings].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.severity] - order[b.severity]
    })

    sections.push({
      id: 'key-findings',
      title: 'Key Findings',
      icon: '',
      content: `${data.findings.length} finding(s) discovered during investigation`,
      items: sortedFindings.map(f => {
        const badge = f.severity === 'critical' ? '[!]' : f.severity === 'high' ? '[!]' : f.severity === 'medium' ? '[!]' : '[i]'
        return `${badge} [${f.severity.toUpperCase()}] ${f.title} - ${f.description} (Source: ${f.source})`
      })
    })
  }

  // ─── Infrastructure Map ───
  if (data.infrastructure.length > 0) {
    const infraItems: string[] = []
    for (const node of data.infrastructure) {
      let line = `[${node.type.toUpperCase()}] ${node.value}`
      if (node.details) line += ` - ${node.details}`
      infraItems.push(line)
      if (node.children) {
        for (const child of node.children) {
          let childLine = `  └─ [${child.type.toUpperCase()}] ${child.value}`
          if (child.details) childLine += ` - ${child.details}`
          infraItems.push(childLine)
        }
      }
    }
    sections.push({
      id: 'infrastructure',
      title: 'Infrastructure Map',
      icon: '',
      content: `${data.infrastructure.length} infrastructure component(s) mapped`,
      items: infraItems
    })
  }

  // ─── Timeline ───
  if (data.timeline.length > 0) {
    sections.push({
      id: 'timeline',
      title: 'Event Timeline',
      icon: '',
      content: `${data.timeline.length} event(s) identified`,
      items: data.timeline.map(e => {
        const icon = e.severity === 'critical' ? '[!]' : e.severity === 'warning' ? '[!]' : '[i]'
        return `${icon} ${e.date} - ${e.event} (${e.source})`
      })
    })
  }

  // ─── Risk Factors ───
  if (data.riskReasons.length > 0) {
    sections.push({
      id: 'risk-factors',
      title: 'Risk Factors',
      icon: '',
      content: `${data.riskReasons.length} risk factor(s) identified contributing to a ${data.riskLevel} risk level`,
      items: data.riskReasons.map(r => `[!] ${r}`),
      severity: data.riskLevel === 'RED' ? 'critical' : data.riskLevel === 'YELLOW' ? 'medium' : 'low'
    })
  }

  // ─── Investigation Leads ───
  if (data.leads.length > 0) {
    sections.push({
      id: 'leads',
      title: 'Investigation Leads',
      icon: '',
      content: 'Potential avenues for further investigation',
      items: data.leads.map(l => `→ ${l}`)
    })
  }

  // ─── Recommendations ───
  if (data.recommendations.length > 0) {
    sections.push({
      id: 'recommendations',
      title: 'Recommendations',
      icon: '',
      content: 'Suggested next steps based on findings',
      items: data.recommendations.map((r, i) => `${i + 1}. ${r}`)
    })
  }

  return {
    generatedAt: new Date().toISOString(),
    target: data.target,
    targetType: data.targetType,
    riskLevel: data.riskLevel,
    riskScore: data.riskScore,
    sections
  }
}
