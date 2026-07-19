import { NextRequest, NextResponse } from 'next/server'

/**
 * DNS lookup via Google DNS-over-HTTPS (free, no key required).
 * Queries A, AAAA, MX, TXT, NS, SOA records.
 */

type DnsRecordType = 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS' | 'SOA'

const RECORD_TYPES: DnsRecordType[] = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'SOA']

interface DnsRecord {
  type: string
  data: string
  ttl?: number
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')?.trim()

  if (!domain) {
    return NextResponse.json({ error: 'No domain provided' }, { status: 400 })
  }

  try {
    const records: DnsRecord[] = []

    // Query all record types in parallel
    const results = await Promise.allSettled(
      RECORD_TYPES.map(async (type) => {
        const res = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
          { signal: AbortSignal.timeout(8000) }
        )
        if (!res.ok) return null
        const data = await res.json()
        return { type, answers: data.Answer || [] }
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        for (const answer of result.value.answers) {
          records.push({
            type: result.value.type,
            data: answer.data || answer.name || '',
            ttl: answer.TTL
          })
        }
      }
    }

    // Check for DMARC
    try {
      const dmarcRes = await fetch(
        `https://dns.google/resolve?name=_dmarc.${encodeURIComponent(domain)}&type=TXT`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (dmarcRes.ok) {
        const dmarcData = await dmarcRes.json()
        if (dmarcData.Answer) {
          for (const answer of dmarcData.Answer) {
            records.push({ type: 'DMARC', data: answer.data, ttl: answer.TTL })
          }
        }
      }
    } catch {
      // DMARC check is optional
    }

    return NextResponse.json({
      domain,
      records,
      recordCount: records.length,
      hasSPF: records.some(r => r.type === 'TXT' && r.data.includes('v=spf1')),
      hasDMARC: records.some(r => r.type === 'DMARC'),
      hasMX: records.some(r => r.type === 'MX'),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'DNS lookup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
