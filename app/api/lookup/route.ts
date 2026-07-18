import { NextRequest, NextResponse } from 'next/server'

const FIELDS =
  'status,country,countryCode,regionName,city,zip,lat,lon,timezone,currency,isp,org,as,asname,proxy,hosting,mobile,query'

// Simple in-memory cache (survives across requests in the same serverless instance)
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  // Check cache first
  const cached = cache.get(query)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  // Build ip-api URL (HTTP is fine from server side — no mixed-content issue)
  const url = query
    ? `http://ip-api.com/json/${encodeURIComponent(query)}?fields=${FIELDS}`
    : `http://ip-api.com/json/?fields=${FIELDS}`

  try {
    const res = await fetch(url)

    // Check rate-limit headers
    const remaining = res.headers.get('X-Rl')
    const resetIn = res.headers.get('X-Ttl')

    if (remaining === '0') {
      return NextResponse.json(
        { error: `Rate limit hit. Try again in ${resetIn} seconds.` },
        { status: 429 }
      )
    }

    const data = await res.json()

    // Store in cache (evict oldest when over 50 entries)
    if (cache.size >= 50) {
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) cache.delete(firstKey)
    }
    cache.set(query, { data, timestamp: Date.now() })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Failed to reach IP lookup service. Please try again.' },
      { status: 502 }
    )
  }
}
