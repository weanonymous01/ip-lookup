'use client'

interface ThreatBadgesProps {
  proxy: boolean
  hosting: boolean
  mobile: boolean
}

export default function ThreatBadges({ proxy, hosting, mobile }: ThreatBadgesProps) {
  const hasThreat = proxy || hosting || mobile

  if (!hasThreat) {
    return (
      <div className="threat-badge-safe">
        <span>No threats detected — IP appears clean</span>
      </div>
    )
  }

  return (
    <div className="threat-badges-container">
      {proxy && (
        <span className="threat-badge threat-badge-danger">
          <span className="threat-badge-pulse" />
          Proxy / VPN Detected
        </span>
      )}
      {hosting && (
        <span className="threat-badge threat-badge-hosting">
          Hosting / Datacenter
        </span>
      )}
      {mobile && (
        <span className="threat-badge threat-badge-mobile">
          Mobile Connection
        </span>
      )}
    </div>
  )
}
