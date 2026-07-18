import type { Metadata } from 'next'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
  title: 'About IP Intelligence Lookup - weanonymous.in',
  description:
    'Learn about the free IP Intelligence Lookup tool built by weanonymous.in for cybersecurity professionals, researchers, and threat analysts.',
  keywords: [
    'about IP lookup',
    'threat intelligence',
    'cybersecurity tools',
    'weanonymous',
    'IP geolocation about',
  ],
}

export default function AboutPage() {
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
            weanonymous.in · about
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
            About IP Intelligence Lookup
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            Free, real-time threat detection and network intelligence for the cybersecurity community.
          </p>
        </header>

        {/* Content Section */}
        <article className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card 1 */}
          <section
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)',
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--card-value)' }}>
              Mission & Purpose
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              IP Intelligence Lookup is a specialized, zero-friction security tool created by{' '}
              <strong>weanonymous.in</strong> to serve our 350k+ cybersecurity community on Instagram and WhatsApp.
              Our goal is to equip researchers, ethical hackers, sysadmins, and everyday users with instant visibility into network infrastructure.
            </p>
          </section>

          {/* Card 2 */}
          <section
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)',
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--card-value)' }}>
              Key Features & Data Points
            </h2>
            <ul style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><strong>Precise Geolocation:</strong> Identify country, region, city, and timezone.</li>
              <li><strong>Network Infrastructure:</strong> Instant ISP lookup, Autonomous System Number (ASN), and organization details.</li>
              <li><strong>Threat Detection:</strong> Identify Proxies, VPN exit nodes, Datacenter/Hosting ranges, and Mobile connections.</li>
              <li><strong>Interactive Mapping:</strong> OpenStreetMap visualization with precise latitude and longitude pin.</li>
            </ul>
          </section>

          {/* Card 3 */}
          <section
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius)',
              padding: 24,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--card-value)' }}>
              Privacy & Ethics First
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              We do not track, log, or store your lookup queries. Our stateless proxy function forwards queries securely
              without keeping lookup histories. No account creation, passwords, or tracking scripts are required.
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
