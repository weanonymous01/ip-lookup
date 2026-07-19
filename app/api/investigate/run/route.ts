import { NextRequest, NextResponse } from 'next/server'
import { detectTargetType, normalizeTarget, extractDomainFromEmail, extractUsernameFromEmail } from '@/lib/targetDetection'
import { correlateData } from '@/lib/correlationEngine'
import { generateReport } from '@/lib/reportGenerator'

/**
 * Master orchestrator for OSINT investigation.
 * Detects target type → fans out parallel API calls → correlates → generates report.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawTarget = body.target?.trim()

    if (!rawTarget) {
      return NextResponse.json({ error: 'No target provided' }, { status: 400 })
    }

    const targetType = detectTargetType(rawTarget)
    if (!targetType) {
      return NextResponse.json(
        { error: 'Could not detect target type. Please enter a valid email, IP, domain, or username.' },
        { status: 400 }
      )
    }

    const target = normalizeTarget(rawTarget, targetType)
    const baseUrl = request.nextUrl.origin

    // Determine which APIs to call based on target type
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const apiCalls: Record<string, Promise<any>> = {}

    if (targetType === 'email') {
      const domain = extractDomainFromEmail(target)
      const username = extractUsernameFromEmail(target)

      apiCalls.whois = fetchApi(`${baseUrl}/api/investigate/whois?target=${encodeURIComponent(domain)}`)
      apiCalls.dns = fetchApi(`${baseUrl}/api/investigate/dns?domain=${encodeURIComponent(domain)}`)
      apiCalls.ipGeo = fetchApi(`${baseUrl}/api/investigate/dns?domain=${encodeURIComponent(domain)}`)
        .then(async (dnsData: any) => {
          // Get A record IP, then look up geolocation
          const aRecord = dnsData?.records?.find((r: any) => r.type === 'A')
          if (aRecord?.data) {
            return fetchApi(`${baseUrl}/api/investigate/ip-geo?ip=${encodeURIComponent(aRecord.data)}`)
          }
          return null
        })
      apiCalls.reverse = fetchApi(`${baseUrl}/api/investigate/reverse?domain=${encodeURIComponent(domain)}`)
      apiCalls.reputation = fetchApi(`${baseUrl}/api/investigate/reputation?target=${encodeURIComponent(domain)}`)
      apiCalls.username = fetchApi(`${baseUrl}/api/investigate/username?username=${encodeURIComponent(username)}&email=${encodeURIComponent(target)}`)
      apiCalls.breach = fetchApi(`${baseUrl}/api/investigate/email-breach?email=${encodeURIComponent(target)}`)
    }

    if (targetType === 'ip') {
      apiCalls.ipGeo = fetchApi(`${baseUrl}/api/investigate/ip-geo?ip=${encodeURIComponent(target)}`)
      apiCalls.reverse = fetchApi(`${baseUrl}/api/investigate/reverse?ip=${encodeURIComponent(target)}`)
      apiCalls.reputation = fetchApi(`${baseUrl}/api/investigate/reputation?target=${encodeURIComponent(target)}`)
      apiCalls.whois = fetchApi(`${baseUrl}/api/investigate/whois?target=${encodeURIComponent(target)}`)
      apiCalls.shodan = fetchApi(`${baseUrl}/api/investigate/shodan?ip=${encodeURIComponent(target)}`)
      apiCalls.reverseDns = fetchApi(`${baseUrl}/api/investigate/reverse-dns?ip=${encodeURIComponent(target)}`)
    }

    if (targetType === 'domain') {
      apiCalls.whois = fetchApi(`${baseUrl}/api/investigate/whois?target=${encodeURIComponent(target)}`)
      apiCalls.dns = fetchApi(`${baseUrl}/api/investigate/dns?domain=${encodeURIComponent(target)}`)
      apiCalls.ipGeo = fetchApi(`${baseUrl}/api/investigate/dns?domain=${encodeURIComponent(target)}`)
        .then(async (dnsData: any) => {
          const aRecord = dnsData?.records?.find((r: any) => r.type === 'A')
          if (aRecord?.data) {
            return fetchApi(`${baseUrl}/api/investigate/ip-geo?ip=${encodeURIComponent(aRecord.data)}`)
          }
          return null
        })
      apiCalls.reverse = fetchApi(`${baseUrl}/api/investigate/reverse?domain=${encodeURIComponent(target)}`)
      apiCalls.reputation = fetchApi(`${baseUrl}/api/investigate/reputation?target=${encodeURIComponent(target)}`)
    }

    if (targetType === 'username') {
      apiCalls.username = fetchApi(`${baseUrl}/api/investigate/username?username=${encodeURIComponent(target)}`)
    }

    // Execute all API calls in parallel
    const apiKeys = Object.keys(apiCalls)
    const apiPromises = Object.values(apiCalls)
    const apiSettled = await Promise.allSettled(apiPromises)

    const apiResults: Record<string, any> = {}
    apiSettled.forEach((result, index) => {
      const key = apiKeys[index]
      if (result.status === 'fulfilled') {
        apiResults[key] = result.value
      } else {
        apiResults[key] = { error: result.reason?.message || 'API call failed' }
      }
    })

    // Correlate all data
    const correlated = correlateData(target, targetType, apiResults)

    // Generate static report as fallback
    const staticReport = generateReport(correlated)

    return NextResponse.json({
      success: true,
      target,
      targetType,
      report: staticReport,
      rawData: apiResults,
      correlated: {
        ...correlated,
        domains: correlated.domains,
        ips: correlated.ips,
        emails: correlated.emails,
        usernames: correlated.usernames,
      }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Investigation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function fetchApi(url: string, timeout = 20000): Promise<any> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeout) })
  if (!res.ok) {
    throw new Error(`API returned ${res.status}`)
  }
  return res.json()
}
