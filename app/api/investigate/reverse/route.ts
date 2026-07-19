import { NextRequest, NextResponse } from 'next/server'

/**
 * Reverse IP lookup (HackerTarget) + SSL certificate transparency (crt.sh).
 * Both are free with no API key required.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ip = searchParams.get('ip')?.trim()
  const domain = searchParams.get('domain')?.trim()

  const results: {
    reverseIp: string[] | null
    reverseDns: string | null
    sslCerts: Array<{ common_name: string; name_value: string; issuer_name: string; not_before: string; not_after: string }> | null
    error?: string
  } = {
    reverseIp: null,
    reverseDns: null,
    sslCerts: null
  }

  try {
    const tasks: Promise<void>[] = []

    // Reverse IP lookup via HackerTarget
    if (ip) {
      tasks.push(
        fetch(`https://api.hackertarget.com/reverseiplookup/?q=${encodeURIComponent(ip)}`, {
          signal: AbortSignal.timeout(15000)
        })
          .then(async (res) => {
            const text = await res.text()
            if (!text.includes('error') && !text.includes('API count exceeded')) {
              results.reverseIp = text
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('No DNS') && line.includes('.'))
            }
          })
          .catch(() => { /* non-critical */ })
      )

      // Reverse DNS
      tasks.push(
        fetch(`https://api.hackertarget.com/reversedns/?q=${encodeURIComponent(ip)}`, {
          signal: AbortSignal.timeout(10000)
        })
          .then(async (res) => {
            const text = await res.text()
            if (!text.includes('error') && !text.includes('API count exceeded')) {
              results.reverseDns = text.trim()
            }
          })
          .catch(() => { /* non-critical */ })
      )
    }

    // SSL Certificate Transparency via crt.sh
    if (domain) {
      tasks.push(
        fetch(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`, {
          signal: AbortSignal.timeout(15000)
        })
          .then(async (res) => {
            if (res.ok) {
              const certs = await res.json()
              // Deduplicate and take recent certs
              const seen = new Set<string>()
              results.sslCerts = certs
                .filter((c: { common_name: string }) => {
                  if (seen.has(c.common_name)) return false
                  seen.add(c.common_name)
                  return true
                })
                .slice(0, 20)
                .map((c: { common_name: string; name_value: string; issuer_name: string; not_before: string; not_after: string }) => ({
                  common_name: c.common_name,
                  name_value: c.name_value,
                  issuer_name: c.issuer_name,
                  not_before: c.not_before,
                  not_after: c.not_after,
                }))
            }
          })
          .catch(() => { /* non-critical */ })
      )
    }

    await Promise.allSettled(tasks)
    return NextResponse.json(results)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reverse lookup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
