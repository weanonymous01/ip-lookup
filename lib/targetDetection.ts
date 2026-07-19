/**
 * Target type detection for OSINT investigation.
 * Auto-detects whether input is an email, IP, domain, or username.
 */

export type TargetType = 'email' | 'ip' | 'domain' | 'username'

export function detectTargetType(input: string): TargetType | null {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null

  // Email: user@domain.com
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'email'

  // IPv4: 192.168.1.1
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) return 'ip'

  // IPv6: 2001:db8::1
  if (/^([a-f0-9]{1,4}:){2,7}[a-f0-9]{1,4}$/i.test(trimmed)) return 'ip'

  // Domain: example.com, sub.example.co.uk (must have a dot and valid TLD)
  if (/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(trimmed)) return 'domain'

  // Username: @johndoe, johndoe, john_doe, john.doe (3-30 chars)
  if (/^@?[a-zA-Z0-9._-]{3,30}$/.test(trimmed)) return 'username'

  return null
}

/**
 * Sanitize and normalize the input based on detected type.
 */
export function normalizeTarget(input: string, type: TargetType): string {
  const trimmed = input.trim()
  if (type === 'username') {
    return trimmed.replace(/^@/, '') // Remove leading @
  }
  return trimmed.toLowerCase()
}

/**
 * Extract domain from email address.
 */
export function extractDomainFromEmail(email: string): string {
  return email.split('@')[1] || ''
}

/**
 * Extract username (local part) from email address.
 */
export function extractUsernameFromEmail(email: string): string {
  return email.split('@')[0] || ''
}
