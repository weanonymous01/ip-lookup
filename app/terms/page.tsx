import type { Metadata } from 'next'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'Terms & Policies - IP Intelligence Lookup',
  description:
    'Terms of Service, Privacy Policy, Acceptable Use, and Rate Limit policies for the IP Intelligence Lookup tool by weanonymous.in.',
  keywords: [
    'terms of service',
    'privacy policy',
    'acceptable use policy',
    'IP lookup terms',
    'weanonymous policies',
  ],
}

export default function TermsPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        color: 'var(--ink)',
        padding: '48px 16px 80px',
      }}
    >
      <ThemeToggle />
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
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
            weanonymous.in · legal
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
            Terms &amp; Policies
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Transparency, acceptable use, and data privacy guidelines for our free intelligence tool.
          </p>
        </header>

        {/* Content Section */}
        <article className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card 1: Privacy Policy */}
          <section
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)',
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--card-value)' }}>
              1. Privacy Policy
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              We respect your privacy. IP Intelligence Lookup operates strictly as a stateless proxy service.
            </p>
            <ul style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><strong>No Data Logging:</strong> We do not log, sell, or monitor your searched IP addresses or search histories.</li>
              <li><strong>No User Accounts:</strong> No registration, email address, or authentication is required to use this tool.</li>
              <li><strong>In-Memory Cache:</strong> Search queries are temporarily cached in RAM for 5 minutes solely to minimize upstream server calls and avoid rate limits.</li>
            </ul>
          </section>

          {/* Card 2: Acceptable Use Policy */}
          <section
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)',
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--card-value)' }}>
              2. Acceptable Use Policy
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              This tool is intended for educational, research, network administration, and threat analysis purposes only.
            </p>
            <ul style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>Automated scraping, excessive polling, or Denial of Service (DoS) attempts are strictly prohibited.</li>
              <li>Users must adhere to fair-use rate limits (maximum 45 requests per minute per IP address).</li>
              <li>Do not use this tool for illegal activities or unauthorized reconnaissance against networks you do not own.</li>
            </ul>
          </section>

          {/* Card 3: Disclaimer & Accuracy */}
          <section
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)',
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--card-value)' }}>
              3. Disclaimer &amp; Liability
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Geolocation and ISP data are provided on an &quot;as is&quot; basis for informational purposes. While we rely on reputable threat intelligence data, weanonymous.in makes no warranties regarding the 100% accuracy of location coordinates or threat detection flags.
            </p>
          </section>

          {/* Navigation CTA */}
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '12px 24px',
                background: 'var(--btn-bg)',
                color: 'var(--btn-text)',
                borderRadius: 'var(--radius)',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              ← Back to IP Lookup
            </Link>
          </div>
        </article>

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            marginTop: 60,
            paddingTop: 24,
            borderTop: '1px solid var(--ink-muted)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, marginBottom: 12 }}>
            <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
              Home
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
