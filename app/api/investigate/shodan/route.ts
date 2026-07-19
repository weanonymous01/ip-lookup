import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ip = searchParams.get('ip')?.trim()

  if (!ip) {
    return NextResponse.json({ error: 'No IP provided' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://internetdb.shodan.io/${ip}`, { signal: AbortSignal.timeout(10000) })
    
    if (res.status === 404) {
      return NextResponse.json({ ports: [], hostnames: [], tags: [], vulns: [], cpes: [] })
    }

    if (!res.ok) {
      throw new Error(`Shodan returned ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Shodan lookup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
