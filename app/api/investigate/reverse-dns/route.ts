import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ip = searchParams.get('ip')?.trim()

  if (!ip) {
    return NextResponse.json({ error: 'No IP provided' }, { status: 400 })
  }

  try {
    // Convert IP to ARPA format for PTR lookup
    let arpa = ''
    if (ip.includes(':')) {
      // Very basic IPv6 to ARPA (simplified for brevity, often better handled by a library, but let's just query direct if possible, else skip IPv6 PTR for now)
      return NextResponse.json({ hostnames: [] })
    } else {
      arpa = ip.split('.').reverse().join('.') + '.in-addr.arpa'
    }

    const res = await fetch(`https://dns.google/resolve?name=${arpa}&type=PTR`, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) {
      throw new Error(`DNS Google returned ${res.status}`)
    }
    
    const data = await res.json()
    const hostnames = (data.Answer || []).map((a: any) => a.data).filter(Boolean)

    return NextResponse.json({ hostnames })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reverse DNS lookup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
