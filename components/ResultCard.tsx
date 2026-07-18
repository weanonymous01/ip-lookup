'use client'

interface ResultCardProps {
  label: string
  value: string
  icon?: string
}

export default function ResultCard({ label, value }: ResultCardProps) {
  return (
    <div className="result-card group">
      <p className="result-card-label">{label}</p>
      <p className="result-card-value">{value || '—'}</p>
    </div>
  )
}
