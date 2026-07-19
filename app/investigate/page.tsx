'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'
import dynamic from 'next/dynamic'
import { detectTargetType } from '@/lib/targetDetection'
import type { InvestigationReport } from '@/lib/reportGenerator'
import './investigate.css'

// Dynamically import IPMap (Leaflet needs browser APIs)
const IPMap = dynamic(() => import('@/components/IPMap'), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 330, marginTop: 16 }} />,
})

interface InvestigationResult {
  success: boolean
  target: string
  targetType: string
  report: InvestigationReport
  aiReport: string | null
  rawData: Record<string, unknown>
  error?: string
}

type StepStatus = 'pending' | 'active' | 'done' | 'error'

interface ProgressStep {
  id: string
  label: string
  status: StepStatus
}

type ReportView = 'ai' | 'structured'

const EXAMPLE_TARGETS = [
  { label: '8.8.8.8', type: 'IP' },
  { label: 'google.com', type: 'Domain' },
  { label: 'torvalds', type: 'Username' },
]

/**
 * Simple markdown-to-HTML renderer for the AI report.
 * Handles headings, bold, lists, code, and paragraphs.
 */
function renderMarkdown(md: string): string {
  return md
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headings
    .replace(/^### (.+)$/gm, '<h3 class="ai-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="ai-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="ai-h1">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.+?)`/g, '<code class="ai-code">$1</code>')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Numbered list items
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Horizontal rules
    .replace(/^---+$/gm, '<hr class="ai-hr">')
    // Wrap consecutive <li> tags in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="ai-list">$1</ul>')
    // Paragraphs — wrap remaining non-tag lines
    .split('\n')
    .map(line => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('<')) return trimmed
      return `<p class="ai-p">${trimmed}</p>`
    })
    .join('\n')
}

export default function InvestigatePage() {
  const [input, setInput] = useState('')
  const [detectedType, setDetectedType] = useState<string | null>(null)
  const [result, setResult] = useState<InvestigationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [steps, setSteps] = useState<ProgressStep[]>([])
  const [showRawData, setShowRawData] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [reportView, setReportView] = useState<ReportView>('ai')

  // Live type detection as user types
  const handleInputChange = (value: string) => {
    setInput(value)
    const type = detectTargetType(value)
    setDetectedType(type)
  }

  const investigate = useCallback(async (target?: string) => {
    const q = target ?? input.trim()
    if (!q) return

    setLoading(true)
    setError('')
    setResult(null)
    setShowRawData(false)

    const type = detectTargetType(q)
    if (!type) {
      setError('Could not detect target type. Enter a valid email, IP, domain, or username.')
      setLoading(false)
      return
    }

    // Build progress steps based on type
    const progressSteps: ProgressStep[] = []
    progressSteps.push({ id: 'detect', label: `Target detected as ${type.toUpperCase()}`, status: 'done' })

    if (type === 'email') {
      progressSteps.push(
        { id: 'breach', label: 'Email breach & paste analysis', status: 'pending' },
        { id: 'whois', label: 'WHOIS lookup on email domain', status: 'pending' },
        { id: 'dns', label: 'DNS record enumeration', status: 'pending' },
        { id: 'reverse', label: 'Reverse IP + SSL certificate search', status: 'pending' },
        { id: 'reputation', label: 'Threat intelligence check', status: 'pending' },
        { id: 'username', label: 'Username & platform search', status: 'pending' },
      )
    } else if (type === 'ip') {
      progressSteps.push(
        { id: 'ipgeo', label: 'IP geolocation & ASN lookup', status: 'pending' },
        { id: 'whois', label: 'WHOIS & Registry lookup', status: 'pending' },
        { id: 'shodan', label: 'Open ports & vulnerability scan', status: 'pending' },
        { id: 'dns', label: 'Reverse DNS / PTR lookup', status: 'pending' },
        { id: 'reverse', label: 'Reverse IP (Domains on server)', status: 'pending' },
        { id: 'reputation', label: 'Threat intelligence check', status: 'pending' },
      )
    } else if (type === 'domain') {
      progressSteps.push(
        { id: 'whois', label: 'WHOIS registration lookup', status: 'pending' },
        { id: 'dns', label: 'DNS record enumeration', status: 'pending' },
        { id: 'reverse', label: 'Reverse IP + SSL certificate search', status: 'pending' },
        { id: 'reputation', label: 'Threat intelligence check', status: 'pending' },
      )
    } else if (type === 'username') {
      progressSteps.push(
        { id: 'username', label: 'Cross-platform username search', status: 'pending' },
      )
    }

    progressSteps.push(
      { id: 'correlate', label: 'Correlating findings', status: 'pending' },
      { id: 'ai', label: '🤖 Mistral AI synthesizing report...', status: 'pending' },
    )

    setSteps(progressSteps)

    // Animate progress steps
    const animateSteps = async () => {
      for (let i = 1; i < progressSteps.length - 1; i++) {
        await new Promise(r => setTimeout(r, 800 + Math.random() * 400))
        setSteps(prev => prev.map((s, idx) =>
          idx === i ? { ...s, status: 'active' as StepStatus } : s
        ))
      }
    }
    animateSteps()

    try {
      const res = await fetch('/api/investigate/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: q })
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Investigation failed')
      }

      // Mark core steps as done, keep AI as pending
      setSteps(prev => prev.map(s => (s.id !== 'ai' ? { ...s, status: 'done' as StepStatus } : s)))
      setResult({ ...data, aiReport: null })
      setReportView('structured')

      // Update URL
      const url = new URL(window.location.href)
      url.searchParams.set('q', q)
      window.history.replaceState({}, '', url.toString())

      // Now fetch AI report in the background
      setIsGeneratingAi(true)
      try {
        const aiRes = await fetch('/api/investigate/ai-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: data.target,
            targetType: data.targetType,
            correlatedData: data.correlated,
            rawData: data.rawData
          })
        })
        
        if (aiRes.ok && aiRes.body) {
          setReportView('ai')
          setResult(prev => prev ? { ...prev, aiReport: '' } : null)
          
          const reader = aiRes.body.getReader()
          const decoder = new TextDecoder()
          let done = false
          let text = ''
          let buffer = ''
          
          while (!done) {
            const { value, done: doneReading } = await reader.read()
            done = doneReading
            if (value) {
              buffer += decoder.decode(value, { stream: true })
              const parts = buffer.split('\n\n')
              // The last part might be incomplete, so keep it in the buffer
              buffer = parts.pop() || ''
              
              for (const part of parts) {
                const lines = part.split('\n')
                for (const line of lines) {
                  if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                      const parsed = JSON.parse(line.slice(6))
                      const token = parsed.choices?.[0]?.delta?.content
                      if (token) {
                        text += token
                        setResult(prev => prev ? { ...prev, aiReport: text } : null)
                      }
                    } catch (e) {
                      // ignore parse errors for partial chunks
                    }
                  }
                }
              }
            }
          }
          setSteps(prev => prev.map(s => (s.id === 'ai' ? { ...s, status: 'done' as StepStatus, label: '[AI] AI report ready!' } : s)))
        } else {
          setSteps(prev => prev.map(s => (s.id === 'ai' ? { ...s, status: 'error' as StepStatus, label: '[AI] AI report generation failed' } : s)))
        }
      } catch (err) {
        setSteps(prev => prev.map(s => (s.id === 'ai' ? { ...s, status: 'error' as StepStatus, label: '[AI] AI report generation failed' } : s)))
      } finally {
        setIsGeneratingAi(false)
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      setSteps(prev => prev.map(s =>
        s.status === 'pending' || s.status === 'active'
          ? { ...s, status: 'error' as StepStatus }
          : s
      ))
    } finally {
      setLoading(false)
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') investigate()
  }

  const copyReport = async () => {
    if (!result) return

    let text: string
    if (reportView === 'ai' && result.aiReport) {
      text = `OSINT INVESTIGATION REPORT\nTarget: ${result.target}\nGenerated: ${result.report.generatedAt}\nPowered by: Mistral Large 3\n\n${result.aiReport}`
    } else {
      text = result.report.sections
        .map(s => `${s.icon} ${s.title}\n${s.content}${s.items ? '\n' + s.items.join('\n') : ''}`)
        .join('\n\n')
      text = `OSINT INVESTIGATION REPORT\nTarget: ${result.target}\nGenerated: ${result.report.generatedAt}\n\n${text}`
    }

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLink = () => {
    if (!result) return
    const url = `${window.location.origin}/investigate?q=${encodeURIComponent(result.target)}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetInvestigation = () => {
    setResult(null)
    setInput('')
    setDetectedType(null)
    setError('')
    setSteps([])
    setShowRawData(false)
    setReportView('ai')
    window.history.replaceState({}, '', '/investigate')
  }

  // Auto-run from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const q = params.get('q')
      if (q) {
        setInput(q)
        setDetectedType(detectTargetType(q))
        investigate(q)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        padding: '48px 16px 80px',
      }}
    >
      <ThemeToggle />
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

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
            weanonymous.in · osint tool
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
            OSINT Investigation Engine
          </h1>
          <p className="hero-subtitle">
            Paste any target - email, IP, domain, or username. AI-powered deep investigation with Mistral Large 3.
          </p>
        </header>

        {/* -- Search Input -- */}
        {!result && (
          <>
            <div
              className="animate-fade-in-up"
              style={{ display: 'flex', gap: 8, marginBottom: 8, animationDelay: '0.1s' }}
            >
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  id="investigate-input"
                  type="text"
                  value={input}
                  onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. 8.8.8.8, google.com, @torvalds"
                  className="search-input"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={loading}
                  style={{ width: '100%' }}
                />
                {detectedType && !loading && (
                  <span className="type-badge" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    {detectedType}
                  </span>
                )}
              </div>
              <button
                id="investigate-btn"
                onClick={() => investigate()}
                disabled={loading || !input.trim()}
                className="search-btn"
              >
                {loading ? (
                  <span style={{ display: 'inline-flex', gap: 4 }}>
                    <span className="animate-pulse">•</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>•</span>
                    <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>•</span>
                  </span>
                ) : (
                  'Investigate ↗'
                )}
              </button>
            </div>

            {/* Example targets */}
            {!loading && (
              <div className="input-hints animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                {EXAMPLE_TARGETS.map(ex => (
                  <button
                    key={ex.label}
                    className="input-hint"
                    onClick={() => {
                      handleInputChange(ex.label)
                      investigate(ex.label)
                    }}
                  >
                    {ex.label} <span style={{ opacity: 0.5 }}>({ex.type})</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* -- Error -- */}
        {error && (
          <div className="error-box" style={{ marginBottom: 24, marginTop: 16 }}>
            {error}
          </div>
        )}

        {/* -- Progress Steps -- */}
        {loading && steps.length > 0 && (
          <div className="investigate-progress scan-overlay animate-fade-in-up">
            {steps.map(step => (
              <div key={step.id} className={`progress-step ${step.status}`}>
                {step.status === 'active' && <div className="progress-spinner" />}
                {step.status === 'done' && <span className="progress-icon">✓</span>}
                {step.status === 'error' && <span className="progress-icon">✗</span>}
                {step.status === 'pending' && <span className="progress-icon" style={{ opacity: 0.3 }}>○</span>}
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* -- Empty State -- */}
        {!result && !loading && !error && !input && (
          <div className="empty-state" style={{ marginTop: 20 }}>
            <div className="empty-state-icon">🕵️</div>
            <p style={{ fontSize: 14, marginBottom: 8 }}>Enter a target above to start investigating</p>
            <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.8 }}>
              <p>Supports: Email · IP Address · Domain · Username</p>
              <p style={{ marginTop: 4, fontSize: 11, opacity: 0.5 }}>
                Powered by Mistral Large 3 AI · Free OSINT APIs · No login required
              </p>
            </div>
          </div>
        )}

        {/* -- Report Display -- */}
        {result && result.report && (
          <div className="report-container">

            {/* Back button */}
            <button
              onClick={resetInvestigation}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--lime)',
                fontSize: 13,
                cursor: 'pointer',
                padding: '4px 0',
                textAlign: 'left',
                fontWeight: 600,
              }}
            >
              ← New Investigation
            </button>

            {/* Report Header */}
            <div className="report-header">
              <p className="report-title">OSINT Investigation Report</p>
              <p className="report-target">{result.target}</p>
              <p className="report-meta">
                Type: {result.targetType.toUpperCase()} · Generated: {new Date(result.report.generatedAt).toLocaleString()}
                {result.aiReport && <span> · [AI] AI: Llama 3.1 70B</span>}
              </p>
              <div
                className={`risk-badge ${result.report.riskLevel.toLowerCase()}`}
              >
                {result.report.riskLevel === 'RED' ? '🔴' : result.report.riskLevel === 'YELLOW' ? '🟡' : '🟢'}
                {result.report.riskLevel} RISK
                <span style={{ opacity: 0.6, fontWeight: 400, fontSize: 12 }}>
                  (Score: {result.report.riskScore}/100)
                </span>
              </div>
            </div>

            {/* View Toggle + Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              {/* Report view toggle */}
              {(result.aiReport || isGeneratingAi) && (
                <div className="report-view-toggle">
                  <button
                    className={`view-toggle-btn ${reportView === 'ai' ? 'active' : ''}`}
                    onClick={() => {
                      if (!isGeneratingAi) setReportView('ai')
                    }}
                    disabled={isGeneratingAi}
                  >
                    {isGeneratingAi ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-pulse">[AI]</span> Synthesizing AI Report...
                      </span>
                    ) : (
                      '[AI] AI Report'
                    )}
                  </button>
                  <button
                    className={`view-toggle-btn ${reportView === 'structured' ? 'active' : ''}`}
                    onClick={() => setReportView('structured')}
                  >
                    [Data] Structured
                  </button>
                </div>
              )}

              {/* Action buttons */}
              <div className="report-actions">
                <button
                  onClick={copyReport}
                  className={`copy-btn ${copied ? 'copy-btn-success' : ''}`}
                >
                  {copied ? '✓ Copied' : '📋 Copy Report'}
                </button>
                <button onClick={shareLink} className="copy-btn">
                  🔗 Share Link
                </button>
              </div>
            </div>

            {/* ── AI Report View ── */}
            {reportView === 'ai' && result.aiReport && (
              <div className="ai-report-container animate-fade-in">
                <div
                  className="ai-report-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(result.aiReport) }}
                />
                <div className="ai-report-footer">
                  <span>🤖 Report generated by Mistral Large 3 via NVIDIA NIM</span>
                </div>
              </div>
            )}

            {/* ── Structured Report View ── */}
            {(reportView === 'structured' || !result.aiReport) && (
              <>
                {result.report.sections.map(section => (
                  <div
                    key={section.id}
                    className={`report-section ${section.severity ? `severity-${section.severity}` : ''}`}
                  >
                    <div className="report-section-header">
                      <span className="report-section-icon">{section.icon}</span>
                      {section.title}
                    </div>
                    <div className="report-section-body">
                      <p className="report-section-content">{section.content}</p>
                      {section.items && section.items.length > 0 && (
                        <ul className="report-section-items">
                          {section.items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Map (if geolocation data is present) */}
            {(result.rawData?.ipGeo as any)?.lat && (
              <div style={{ marginTop: 16, borderTop: '1px solid var(--ink-muted)', paddingTop: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Physical Geolocation</h3>
                <IPMap 
                  lat={(result.rawData.ipGeo as any).lat} 
                  lon={(result.rawData.ipGeo as any).lon} 
                  city={(result.rawData.ipGeo as any).city} 
                />
              </div>
            )}

            {/* Raw Data Toggle */}
            <button
              className="raw-data-toggle"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? '▲ Hide' : '▼ Show'} Raw API Data
            </button>
            {showRawData && (
              <div className="raw-data-content animate-fade-in">
                {JSON.stringify(result.rawData, null, 2)}
              </div>
            )}
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
              IP Lookup
            </Link>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <Link href="/investigate" style={{ color: 'var(--lime)', textDecoration: 'underline', fontWeight: 600 }}>
              Investigate
            </Link>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <Link href="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
              About
            </Link>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <Link href="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
              Terms
            </Link>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-faint)', lineHeight: 1.8 }}>
            Built for{' '}
            <a href="https://weanonymous.in" style={{ textDecoration: 'underline', color: 'inherit' }}>
              weanonymous.in
            </a>{' '}
            · Powered by Mistral Large 3 + Free OSINT APIs
          </p>
        </footer>
      </div>
    </main>
  )
}
