'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ResultCard from '@/components/ResultCard'
import ThreatBadges from '@/components/ThreatBadges'
import ThemeToggle from '@/components/ThemeToggle'
import dynamic from 'next/dynamic'

// Dynamically import IPMap (Leaflet needs browser APIs)
const IPMap = dynamic(() => import('@/components/IPMap'), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 330 }} />,
})

interface IPData {
  status: string
  country: string
  countryCode: string
  regionName: string
  region: string
  city: string
  zip: string
  lat: number
  lon: number
  timezone: string
  currency: string
  isp: string
  org: string
  as: string
  asname: string
  proxy: boolean
  hosting: boolean
  mobile: boolean
  query: string
  reverse?: string
  searchedHost?: string
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<IPData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [lookupCount, setLookupCount] = useState(0)

  // Read IP from URL on mount (share link support)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      setQuery(q)
      performLookup(q)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const performLookup = useCallback(async (ip?: string) => {
    setLoading(true)
    setError('')
    setResult(null)
    setCopied(false)
    const q = ip ?? query

    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(q)}`)
      const data = await res.json()

      if (data.error) throw new Error(data.error)
      if (data.status === 'fail') throw new Error('Invalid IP address or domain name')

      setResult(data)
      setLookupCount(prev => prev + 1)

      // Update URL for share link (without reload)
      if (data.query) {
        const url = new URL(window.location.href)
        url.searchParams.set('q', data.query)
        window.history.replaceState({}, '', url.toString())
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') performLookup()
  }

  const copyToClipboard = async () => {
    if (!result) return
    const text = JSON.stringify(result, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = () => {
    if (!result) return
    const url = `${window.location.origin}${window.location.pathname}?q=${result.query}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        padding: '48px 16px 80px',
      }}
    >
      <ThemeToggle />
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* ── Header ── */}
        <header className="animate-fade-in-up" style={{ textAlign: 'center', marginBottom: 40 }}>
          <p
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--text-tertiary)',
              marginBottom: 16,
              fontWeight: 500,
            }}
          >
            weanonymous.in · free tool
          </p>
          <h1
            style={{
              fontSize: 'clamp(26px, 5vw, 36px)',
              fontWeight: 700,
              color: 'var(--ink)',
              marginBottom: 10,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            IP Intelligence Lookup
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Paste any IP address or domain - see location, ISP, and threat flags instantly
          </p>
        </header>

        {/* ── Search ── */}
        <div
          className="animate-fade-in-up"
          style={{ display: 'flex', gap: 8, marginBottom: 12, animationDelay: '0.1s' }}
        >
          <input
            id="ip-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 8.8.8.8 or example.com"
            className="search-input"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            id="lookup-btn"
            onClick={() => performLookup()}
            disabled={loading}
            className="search-btn"
          >
            {loading ? (
              <span style={{ display: 'inline-flex', gap: 4 }}>
                <span className="animate-pulse">•</span>
                <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>•</span>
                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>•</span>
              </span>
            ) : (
              'Lookup'
            )}
          </button>
        </div>

        {/* Check my IP */}
        <div
          className="animate-fade-in-up"
          style={{ textAlign: 'center', marginBottom: 36, animationDelay: '0.15s' }}
        >
          <button
            id="check-my-ip-btn"
            onClick={() => {
              setQuery('')
              performLookup('')
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              color: 'var(--text-tertiary)',
              padding: '4px 8px',
              transition: 'color var(--transition)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            Check my own IP →
          </button>
        </div>

        {/* ── Error State ── */}
        {error && (
          <div className="error-box" style={{ marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* ── Loading State ── */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ height: 42 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 90 }} />
              ))}
            </div>
            <div className="skeleton" style={{ height: 330 }} />
          </div>
        )}

        {/* ── Empty State ── */}
        {!result && !loading && !error && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <p style={{ fontSize: 14, marginBottom: 4 }}>Enter an IP or domain above to begin</p>
            <p style={{ fontSize: 12, opacity: 0.7 }}>
              Try <button
                onClick={() => { setQuery('8.8.8.8'); performLookup('8.8.8.8') }}
                style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}
              >8.8.8.8</button> or <button
                onClick={() => { setQuery('1.1.1.1'); performLookup('1.1.1.1') }}
                style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}
              >1.1.1.1</button>
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Queried Target + Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span className="queried-ip">
                {result.searchedHost && result.searchedHost !== result.query ? (
                  <>
                    <span style={{ color: 'rgba(11, 11, 15, 0.6)', fontFamily: 'inherit', fontWeight: 600 }}>DOMAIN</span>
                    {result.searchedHost} <span style={{ opacity: 0.5 }}>({result.query})</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: 'rgba(11, 11, 15, 0.6)', fontFamily: 'inherit', fontWeight: 600 }}>IP</span>
                    {result.query}
                  </>
                )}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  id="copy-btn"
                  onClick={copyToClipboard}
                  className={`copy-btn ${copied ? 'copy-btn-success' : ''}`}
                >
                  {copied ? '✓ Copied' : 'Copy JSON'}
                </button>
                <button
                  id="share-btn"
                  onClick={shareLink}
                  className="copy-btn"
                >
                  Share
                </button>
              </div>
            </div>

            {/* Threat Badges */}
            <ThreatBadges proxy={result.proxy} hosting={result.hosting} mobile={result.mobile} />

            {/* Data Grid */}
            {result.searchedHost && /[a-zA-Z]/.test(result.searchedHost) ? (
              <div
                className="stagger-children"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                }}
              >
                <ResultCard label="Hostname / Reverse DNS" value={result.reverse || result.searchedHost || '-'} />
                <ResultCard label="Resolved IP" value={result.query} />
                <ResultCard label="Organization" value={result.org || result.asname || '-'} />
                <ResultCard label="Country" value={`${result.country} (${result.countryCode})`} />
                <ResultCard label="City" value={`${result.city}, ${result.regionName}`} />
                <ResultCard label="ISP" value={result.isp} />
              </div>
            ) : (
              <div
                className="stagger-children"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                }}
              >
                <ResultCard label="Country" value={`${result.country} (${result.countryCode})`} />
                <ResultCard label="City" value={`${result.city}, ${result.regionName}`} />
                <ResultCard label="Timezone" value={result.timezone} />
                <ResultCard label="ISP" value={result.isp} />
                <ResultCard label="Region / State" value={`${result.regionName} (${result.region})`} />
                <ResultCard label="ZIP / Currency" value={`${result.zip || '-'} · ${result.currency}`} />
              </div>
            )}

            {/* Map */}
            <IPMap lat={result.lat} lon={result.lon} city={result.city} />

            {/* Lookup counter */}
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
              {lookupCount} lookup{lookupCount !== 1 ? 's' : ''} this session
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        <footer
          className="animate-fade-in-up"
          style={{
            textAlign: 'center',
            marginTop: 60,
            paddingTop: 24,
            borderTop: '1px solid var(--ink-muted)',
            animationDelay: '0.3s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, marginBottom: 12 }}>
            <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
              Home
            </Link>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <Link href="/investigate" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
              Investigate
            </Link>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <Link href="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
              About Tool
            </Link>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <Link href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
              Terms &amp; Policies
            </Link>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.8 }}>
            Built for{' '}
            <a href="https://weanonymous.in" style={{ textDecoration: 'underline', color: 'inherit' }}>
              weanonymous.in
            </a>{' '}
            · Free &amp; open
          </p>
        </footer>
      </div>
    </main>
  )
}
