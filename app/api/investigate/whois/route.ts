import { NextRequest, NextResponse } from 'next/server'

/**
 * WHOIS lookup via RDAP (free, no key required).
 * Falls back to a simplified response on error.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const target = searchParams.get('target')?.trim()

  if (!target) {
    return NextResponse.json({ error: 'No target provided' }, { status: 400 })
  }

  try {
    // Determine if IP or Domain for RDAP
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(target) || /^[a-fA-F0-9:]+$/.test(target)
    const rdapType = isIp ? 'ip' : 'domain'
    
    // Try RDAP first (official successor to WHOIS, free)
    const rdapRes = await fetch(
      `https://rdap.org/${rdapType}/${encodeURIComponent(target)}`,
      { signal: AbortSignal.timeout(10000) }
    )

    if (rdapRes.ok) {
      const data = await rdapRes.json()

      // Extract useful fields from RDAP response
      const result: Record<string, string | null> = {
        domainName: target,
        registrar: null,
        creationDate: null,
        expiryDate: null,
        updatedDate: null,
        status: null,
        nameservers: null,
        registrantOrg: null,
      }

      // Extract registrar
      if (data.entities) {
        for (const entity of data.entities) {
          if (entity.roles?.includes('registrar')) {
            result.registrar = entity.vcardArray?.[1]?.find(
              (v: string[]) => v[0] === 'fn'
            )?.[3] || entity.handle || null
          }
          if (entity.roles?.includes('registrant')) {
            result.registrantOrg = entity.vcardArray?.[1]?.find(
              (v: string[]) => v[0] === 'org'
            )?.[3] || entity.vcardArray?.[1]?.find(
              (v: string[]) => v[0] === 'fn'
            )?.[3] || null
          }
        }
      }

      // Extract dates
      if (data.events) {
        for (const event of data.events) {
          if (event.eventAction === 'registration') result.creationDate = event.eventDate
          if (event.eventAction === 'expiration') result.expiryDate = event.eventDate
          if (event.eventAction === 'last changed') result.updatedDate = event.eventDate
        }
      }

      // Extract nameservers
      if (data.nameservers) {
        result.nameservers = data.nameservers.map((ns: { ldhName?: string }) => ns.ldhName).filter(Boolean).join(', ')
      }

      // Status
      if (data.status) {
        result.status = Array.isArray(data.status) ? data.status.join(', ') : data.status
      }

      return NextResponse.json(result)
    }

    return NextResponse.json({
      domainName: target,
      error: 'WHOIS data not available for this target'
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'WHOIS lookup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
