import { NextRequest, NextResponse } from 'next/server'

const FIELDS =
  'status,country,countryCode,regionName,city,zip,lat,lon,timezone,currency,isp,org,as,asname,proxy,hosting,mobile,query,reverse'

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || ''

  let targetIp = query

  // If query is empty, extract the caller's real public IP from Vercel headers
  if (!targetIp) {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfIp = request.headers.get('cf-connecting-ip')

    const clientIp = (forwarded ? forwarded.split(',')[0].trim() : (realIp || cfIp || '')).trim()

    if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1' && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.')) {
      targetIp = clientIp
    }
  }

  // Use targetIp as cache key to prevent user IP collision in cache
  const cacheKey = targetIp || 'own-ip'

  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  // Build ip-api URL
  const url = targetIp
    ? `http://ip-api.com/json/${encodeURIComponent(targetIp)}?fields=${FIELDS}`
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
    if (query) {
      data.searchedHost = query
    }

    // Store in cache (keep max 50 entries)
    if (cache.size >= 50) {
      const firstKey = cache.keys().next().value
      if (firstKey !== undefined) cache.delete(firstKey)
    }
    cache.set(cacheKey, { data, timestamp: Date.now() })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: 'Failed to reach IP lookup service. Please try again.' },
      { status: 502 }
    )
  }
}
