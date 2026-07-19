import { NextRequest, NextResponse } from 'next/server'

/**
 * URL/Domain reputation check via URLhaus (abuse.ch).
 * Free, no API key required.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const target = searchParams.get('target')?.trim()

  if (!target) {
    return NextResponse.json({ error: 'No target provided' }, { status: 400 })
  }

  try {
    // URLhaus — malicious URL database
    const urlhausRes = await fetch('https://urlhaus-api.abuse.ch/v1/host/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `host=${encodeURIComponent(target)}`,
      signal: AbortSignal.timeout(10000)
    })

    if (urlhausRes.ok) {
      const data = await urlhausRes.json()

      const malicious = data.query_status === 'no_results' ? false : true
      const urlsCount = data.urls ? data.urls.length : 0

      return NextResponse.json({
        target,
        malicious,
        query_status: data.query_status,
        urls_count: urlsCount,
        details: malicious
          ? `Found ${urlsCount} malicious URL(s) associated with ${target}`
          : `No malicious URLs found for ${target}`,
        urlhaus_reference: data.urlhaus_reference || null,
        firstSeen: data.firstseen || null,
        tags: data.tags || [],
        urls: (data.urls || []).slice(0, 5).map((u: { url: string; url_status: string; threat: string; date_added: string }) => ({
          url: u.url,
          status: u.url_status,
          threat: u.threat,
          dateAdded: u.date_added
        }))
      })
    }

    return NextResponse.json({
      target,
      malicious: false,
      details: 'Reputation check returned no results',
      urls_count: 0
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reputation check failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
