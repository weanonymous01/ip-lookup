/**
 * Correlation Engine — links discovered data across OSINT sources.
 * Builds connections, timelines, and risk assessments.
 */

export interface CorrelatedData {
  target: string
  targetType: string
  riskLevel: 'GREEN' | 'YELLOW' | 'RED'
  riskScore: number
  riskReasons: string[]
  summary: string
  domains: string[]
  ips: string[]
  emails: string[]
  usernames: string[]
  timeline: TimelineEvent[]
  findings: Finding[]
  infrastructure: InfrastructureNode[]
  leads: string[]
  recommendations: string[]
}

export interface TimelineEvent {
  date: string
  event: string
  source: string
  severity: 'info' | 'warning' | 'critical'
}

export interface Finding {
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  source: string
}

export interface InfrastructureNode {
  type: 'domain' | 'ip' | 'email' | 'service' | 'cert' | 'dns'
  value: string
  details?: string
  children?: InfrastructureNode[]
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function correlateData(
  target: string,
  targetType: string,
  apiResults: Record<string, any>
): CorrelatedData {
  const domains = new Set<string>()
  const ips = new Set<string>()
  const emails = new Set<string>()
  const usernames = new Set<string>()
  const timeline: TimelineEvent[] = []
  const findings: Finding[] = []
  const infrastructure: InfrastructureNode[] = []
  const leads: string[] = []
  const recommendations: string[] = []
  let riskScore = 0
  const riskReasons: string[] = []

  // ─── Extract data from email target ───
  if (targetType === 'email') {
    emails.add(target)
    const domain = target.split('@')[1]
    if (domain) domains.add(domain)
    const username = target.split('@')[0]
    if (username) usernames.add(username)

    leads.push(`Search for username "${username}" on other platforms`)
    leads.push(`Check if ${domain} has other email addresses exposed`)
  }

  // ─── Extract from IP target ───
  if (targetType === 'ip') {
    ips.add(target)
  }

  // ─── Extract from domain target ───
  if (targetType === 'domain') {
    domains.add(target)
  }

  // ─── Extract from username target ───
  if (targetType === 'username') {
    const clean = target.replace(/^@/, '')
    usernames.add(clean)
    leads.push(`Check domains: ${clean}.com, ${clean}.net, ${clean}.org`)
  }

  // ─── Process WHOIS data ───
  if (apiResults.whois && !apiResults.whois.error) {
    const w = apiResults.whois
    const entityType = targetType === 'ip' ? 'IP' : 'Domain'
    if (w.registrar) {
      findings.push({
        title: `${entityType} Registration`,
        description: `Registered via ${w.registrar}${w.creationDate ? ` on ${w.creationDate}` : ''}${w.expiryDate ? `, expires ${w.expiryDate}` : ''}`,
        severity: 'low',
        source: 'WHOIS'
      })
    }
    if (w.creationDate) {
      timeline.push({ date: w.creationDate, event: `${entityType} allocated/registered`, source: 'WHOIS', severity: 'info' })
    }
    if (w.expiryDate) {
      timeline.push({ date: w.expiryDate, event: `${entityType} expires`, source: 'WHOIS', severity: 'info' })
    }
    if (w.registrantOrg) {
      infrastructure.push({ type: targetType === 'ip' ? 'ip' : 'domain', value: w.domainName || target, details: `Org: ${w.registrantOrg}` })
    }
  }

  // ─── Process IP Geolocation ───
  if (apiResults.ipGeo && !apiResults.ipGeo.error) {
    const geo = apiResults.ipGeo
    if (geo.query) ips.add(geo.query)

    const ipNode: InfrastructureNode = {
      type: 'ip',
      value: geo.query || target,
      details: `${geo.city || '?'}, ${geo.country || '?'} - ${geo.isp || '?'}`,
      children: []
    }

    if (geo.org) {
      ipNode.children!.push({ type: 'service', value: geo.org, details: `ASN: ${geo.as || 'N/A'}` })
    }

    infrastructure.push(ipNode)

    if (geo.proxy) {
      riskScore += 30
      riskReasons.push('IP detected as proxy/VPN')
      findings.push({
        title: '[!] Proxy/VPN Detected',
        description: `IP ${geo.query} is flagged as a proxy or VPN endpoint`,
        severity: 'high',
        source: 'IP Geolocation'
      })
    }
    if (geo.hosting) {
      findings.push({
        title: 'Hosting/Data Center IP',
        description: `IP belongs to a hosting provider: ${geo.isp || 'Unknown'}`,
        severity: 'medium',
        source: 'IP Geolocation'
      })
    }
  }

  // ─── Process DNS records ───
  if (apiResults.dns && !apiResults.dns.error) {
    const dns = apiResults.dns
    if (dns.records) {
      const dnsNode: InfrastructureNode = {
        type: 'dns',
        value: 'DNS Records',
        children: []
      }

      for (const record of dns.records) {
        if (record.type === 'A' || record.type === 'AAAA') {
          ips.add(record.data)
          dnsNode.children!.push({ type: 'ip', value: record.data, details: `${record.type} record` })
        }
        if (record.type === 'MX') {
          dnsNode.children!.push({ type: 'service', value: record.data, details: 'Mail server' })
          // Check email provider
          if (record.data.includes('google')) {
            findings.push({ title: 'Google Workspace', description: 'Domain uses Google for email', severity: 'low', source: 'DNS' })
          } else if (record.data.includes('outlook') || record.data.includes('microsoft')) {
            findings.push({ title: 'Microsoft 365', description: 'Domain uses Microsoft for email', severity: 'low', source: 'DNS' })
          }
        }
        if (record.type === 'TXT') {
          if (record.data.includes('v=spf1')) {
            findings.push({ title: 'SPF Record Found', description: 'Email authentication is configured', severity: 'low', source: 'DNS' })
          }
          if (!record.data.includes('v=spf1') && !dns.records.some((r: any) => r.type === 'TXT' && r.data.includes('v=spf1'))) {
            riskScore += 10
            riskReasons.push('No SPF record - vulnerable to email spoofing')
          }
        }
      }

      if (dnsNode.children!.length > 0) {
        infrastructure.push(dnsNode)
      }
    }
  }

  // ─── Process Reverse lookups ───
  if (apiResults.reverse && !apiResults.reverse.error) {
    const rev = apiResults.reverse
    if (rev.reverseIp && Array.isArray(rev.reverseIp)) {
      const count = rev.reverseIp.length
      if (count > 20) {
        findings.push({
          title: `${count} Domains on Same IP`,
          description: `Shared hosting detected - ${count} other domains on same server`,
          severity: 'medium',
          source: 'Reverse IP'
        })
        riskScore += 5
        riskReasons.push('Shared hosting environment')
      } else if (count > 0) {
        findings.push({
          title: `${count} Related Domain${count > 1 ? 's' : ''}`,
          description: `Found ${count} other domain${count > 1 ? 's' : ''} on the same IP`,
          severity: 'low',
          source: 'Reverse IP'
        })
      }
      for (const d of rev.reverseIp.slice(0, 10)) {
        domains.add(d)
      }
    }

    if (rev.sslCerts && Array.isArray(rev.sslCerts) && rev.sslCerts.length > 0) {
      findings.push({
        title: `${rev.sslCerts.length} SSL Certificate${rev.sslCerts.length > 1 ? 's' : ''} Found`,
        description: `Certificate transparency logs show ${rev.sslCerts.length} cert(s) issued`,
        severity: 'low',
        source: 'crt.sh'
      })
      const certNode: InfrastructureNode = {
        type: 'cert',
        value: 'SSL Certificates',
        children: rev.sslCerts.slice(0, 8).map((c: any) => ({
          type: 'cert' as const,
          value: c.common_name || c.name_value || 'Unknown',
          details: c.issuer_name ? `Issuer: ${c.issuer_name}` : undefined
        }))
      }
      infrastructure.push(certNode)
    }
  }

  // ─── Process Shodan (InternetDB) ───
  if (apiResults.shodan && !apiResults.shodan.error) {
    const shodan = apiResults.shodan
    if (shodan.ports && shodan.ports.length > 0) {
      findings.push({
        title: `${shodan.ports.length} Open Port(s) Detected`,
        description: `Exposed services on ports: ${shodan.ports.join(', ')}`,
        severity: shodan.ports.some((p: number) => [22, 23, 3389, 445].includes(p)) ? 'high' : 'medium',
        source: 'Shodan'
      })
      if (shodan.ports.includes(22)) riskReasons.push('SSH (Port 22) exposed')
      if (shodan.ports.includes(3389)) riskReasons.push('RDP (Port 3389) exposed')
      if (shodan.ports.some((p: number) => [22, 23, 3389, 445].includes(p))) riskScore += 20
    }
    if (shodan.vulns && shodan.vulns.length > 0) {
      findings.push({
        title: `${shodan.vulns.length} Vulnerabilities (CVEs) found`,
        description: `Target is vulnerable to: ${shodan.vulns.slice(0, 5).join(', ')}${shodan.vulns.length > 5 ? ' and more' : ''}`,
        severity: 'critical',
        source: 'Shodan'
      })
      riskScore += 40
      riskReasons.push(`Vulnerable to ${shodan.vulns.length} known CVEs`)
    }
    if (shodan.tags && shodan.tags.length > 0) {
      findings.push({
        title: 'Shodan Tags',
        description: `Categorized as: ${shodan.tags.join(', ')}`,
        severity: 'info',
        source: 'Shodan'
      })
    }
    if (shodan.hostnames && shodan.hostnames.length > 0) {
      for (const h of shodan.hostnames) {
        domains.add(h)
      }
    }
  }

  // ─── Process Reverse DNS (PTR) ───
  if (apiResults.reverseDns && !apiResults.reverseDns.error) {
    const rdns = apiResults.reverseDns
    if (rdns.hostnames && rdns.hostnames.length > 0) {
      findings.push({
        title: 'Reverse DNS Records Found',
        description: `PTR records: ${rdns.hostnames.join(', ')}`,
        severity: 'info',
        source: 'Reverse DNS'
      })
      for (const h of rdns.hostnames) {
        domains.add(h.replace(/\.$/, ''))
      }
    }
  }

  // ─── Process Reputation ───
  if (apiResults.reputation && !apiResults.reputation.error) {
    const rep = apiResults.reputation
    if (rep.malicious) {
      riskScore += 50
      riskReasons.push('Target flagged as malicious in threat databases')
      findings.push({
        title: '🚨 Malicious Activity Detected',
        description: rep.details || 'This target has been flagged in threat intelligence databases',
        severity: 'critical',
        source: 'URLhaus'
      })
    }
    if (rep.urls_count && rep.urls_count > 0) {
      findings.push({
        title: `${rep.urls_count} Malicious URL(s) Associated`,
        description: `URLhaus reports ${rep.urls_count} malicious URLs linked to this target`,
        severity: 'high',
        source: 'URLhaus'
      })
      riskScore += 25
      riskReasons.push(`${rep.urls_count} malicious URLs in threat database`)
    }
  }

  // ─── Process Username search ───
  if (apiResults.username && !apiResults.username.error) {
    const usr = apiResults.username
    if (usr.profiles && Array.isArray(usr.profiles)) {
      const found = usr.profiles.filter((p: any) => p.found)
      if (found.length > 0) {
        findings.push({
          title: `Username Found on ${found.length} Platform${found.length > 1 ? 's' : ''}`,
          description: `Accounts found: ${found.map((p: any) => p.platform).join(', ')}`,
          severity: 'medium',
          source: 'Username Search'
        })
        for (const p of found) {
          infrastructure.push({
            type: 'service',
            value: p.platform,
            details: p.url || `Account: ${p.username || target}`
          })
        }
      }
    }
    if (usr.gravatar) {
      findings.push({
        title: 'Gravatar Profile Found',
        description: `A Gravatar profile exists for this identity`,
        severity: 'low',
        source: 'Gravatar'
      })
    }
  }

  // ─── Process Email Breaches (XposedOrNot) ───
  if (apiResults.breach && !apiResults.breach.error) {
    const breach = apiResults.breach
    if (breach.breaches && breach.breaches.length > 0) {
      const count = breach.breaches.length
      
      findings.push({
        title: `Email found in ${count} Data Breach${count !== 1 ? 'es' : ''}`,
        description: `This email was compromised in: ${breach.breaches.slice(0, 3).map((b: any) => b.name).join(', ')}${count > 3 ? ` and ${count - 3} more` : ''}`,
        severity: count > 3 ? 'critical' : 'high',
        source: 'XposedOrNot'
      })
      
      riskScore += count * 5
      riskReasons.push(`Exposed in ${count} data breaches`)
      
      if (breach.pastes > 0) {
        findings.push({
          title: `Found in ${breach.pastes} Public Paste${breach.pastes !== 1 ? 's' : ''}`,
          description: 'This email appears in public text dumps (e.g., Pastebin), often indicating leaked credentials.',
          severity: 'high',
          source: 'XposedOrNot'
        })
        riskScore += 15
        riskReasons.push(`Found in ${breach.pastes} public pastes`)
      }

      for (const b of breach.breaches) {
        if (b.date) {
          timeline.push({
            date: `${b.date}-01-01`, // XposedOrNot returns years mostly, pad to valid date
            event: `Data breach: ${b.name} (${b.records ? b.records.toLocaleString() + ' records' : 'Unknown size'})`,
            source: 'XposedOrNot',
            severity: 'warning'
          })
        }
      }
    }
  }

  // ─── Generate recommendations ───
  if (riskScore >= 50) {
    recommendations.push('Immediately assess if this target is associated with your infrastructure')
    recommendations.push('Check threat intelligence feeds for additional indicators')
  }
  if (riskScore >= 20) {
    recommendations.push('Monitor this target for future changes')
    recommendations.push('Cross-reference findings with internal security logs')
  }
  if (domains.size > 1) {
    recommendations.push(`Investigate the ${domains.size} related domains for shared ownership`)
  }
  if (usernames.size > 0) {
    recommendations.push('Search discovered usernames in breach databases')
  }
  recommendations.push('Verify findings with additional OSINT sources')
  recommendations.push('Document and archive this investigation for future reference')

  // ─── Determine risk level ───
  let riskLevel: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN'
  if (riskScore >= 50) riskLevel = 'RED'
  else if (riskScore >= 20) riskLevel = 'YELLOW'

  // ─── Sort timeline ───
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // ─── Generate summary ───
  const summaryParts: string[] = []
  if (findings.length > 0) summaryParts.push(`${findings.length} findings discovered`)
  if (domains.size > 0) summaryParts.push(`${domains.size} domain(s) identified`)
  if (ips.size > 0) summaryParts.push(`${ips.size} IP(s) found`)
  if (riskReasons.length > 0) summaryParts.push(`Risk factors: ${riskReasons.join('; ')}`)

  const summary = summaryParts.length > 0
    ? summaryParts.join('. ') + '.'
    : `Investigation of ${targetType} "${target}" completed. No significant findings.`

  return {
    target,
    targetType,
    riskLevel,
    riskScore,
    riskReasons,
    summary,
    domains: Array.from(domains),
    ips: Array.from(ips),
    emails: Array.from(emails),
    usernames: Array.from(usernames),
    timeline,
    findings,
    infrastructure,
    leads,
    recommendations
  }
}
