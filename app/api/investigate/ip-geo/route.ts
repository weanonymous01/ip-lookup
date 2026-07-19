import { NextRequest, NextResponse } from 'next/server'

/**
 * IP Geolocation via ip-api.com (free, no key required).
 * Returns location, ISP, ASN, proxy/VPN/hosting flags.
 */

const FIELDS =
  'status,country,countryCode,regionName,city,zip,lat,lon,timezone,currency,isp,org,as,asname,proxy,hosting,mobile,query,reverse'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ip = searchParams.get('ip')?.trim()

  if (!ip) {
    return NextResponse.json({ error: 'No IP provided' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${FIELDS}`,
      { signal: AbortSignal.timeout(10000) }
    )

    // Handle rate limiting
    const remaining = res.headers.get('X-Rl')
    if (remaining === '0') {
      const resetIn = res.headers.get('X-Ttl')
      return NextResponse.json(
        { error: `Rate limited. Try again in ${resetIn}s.` },
        { status: 429 }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'IP geolocation lookup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
