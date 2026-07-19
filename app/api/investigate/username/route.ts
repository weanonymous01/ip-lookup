import { NextRequest, NextResponse } from 'next/server'

/**
 * Username search across platforms.
 * Uses GitHub API (free, no key), Gravatar hash check, and HTTP HEAD checks.
 */

import { createHash } from 'crypto'

interface PlatformResult {
  platform: string
  found: boolean
  url: string | null
  username: string
  details?: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')?.trim().replace(/^@/, '')
  const email = searchParams.get('email')?.trim()

  if (!username && !email) {
    return NextResponse.json({ error: 'No username or email provided' }, { status: 400 })
  }

  const profiles: PlatformResult[] = []
  let gravatar: string | null = null

  const tasks: Promise<void>[] = []

  const targetUsername = username || ''

  if (targetUsername) {
    // GitHub API (free, 60 req/hour unauthenticated)
    tasks.push(
      fetch(`https://api.github.com/users/${encodeURIComponent(targetUsername)}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'osint-investigate-tool' },
        signal: AbortSignal.timeout(8000)
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            profiles.push({
              platform: 'GitHub',
              found: true,
              url: data.html_url,
              username: data.login,
              details: `${data.public_repos || 0} repos · ${data.followers || 0} followers · Created: ${data.created_at?.split('T')[0] || 'N/A'}`
            })
          } else {
            profiles.push({ platform: 'GitHub', found: false, url: null, username: targetUsername })
          }
        })
        .catch(() => {
          profiles.push({ platform: 'GitHub', found: false, url: null, username: targetUsername })
        })
    )

    // GitLab
    tasks.push(
      fetch(`https://gitlab.com/api/v4/users?username=${encodeURIComponent(targetUsername)}`, {
        signal: AbortSignal.timeout(8000)
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data) && data.length > 0) {
              profiles.push({
                platform: 'GitLab',
                found: true,
                url: data[0].web_url,
                username: data[0].username,
                details: `ID: ${data[0].id}`
              })
            } else {
              profiles.push({ platform: 'GitLab', found: false, url: null, username: targetUsername })
            }
          } else {
            profiles.push({ platform: 'GitLab', found: false, url: null, username: targetUsername })
          }
        })
        .catch(() => {
          profiles.push({ platform: 'GitLab', found: false, url: null, username: targetUsername })
        })
    )

    // Reddit (check if user page returns 200)
    tasks.push(
      fetch(`https://www.reddit.com/user/${encodeURIComponent(targetUsername)}/about.json`, {
        headers: { 'User-Agent': 'osint-investigate-tool/1.0' },
        signal: AbortSignal.timeout(8000)
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            if (data.data && !data.error) {
              profiles.push({
                platform: 'Reddit',
                found: true,
                url: `https://reddit.com/u/${targetUsername}`,
                username: targetUsername,
                details: `Karma: ${data.data.total_karma || 0} · Created: ${data.data.created_utc ? new Date(data.data.created_utc * 1000).toISOString().split('T')[0] : 'N/A'}`
              })
            } else {
              profiles.push({ platform: 'Reddit', found: false, url: null, username: targetUsername })
            }
          } else {
            profiles.push({ platform: 'Reddit', found: false, url: null, username: targetUsername })
          }
        })
        .catch(() => {
          profiles.push({ platform: 'Reddit', found: false, url: null, username: targetUsername })
        })
    )

    // Hacker News
    tasks.push(
      fetch(`https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(targetUsername)}.json`, {
        signal: AbortSignal.timeout(8000)
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            if (data && data.id) {
              profiles.push({
                platform: 'Hacker News',
                found: true,
                url: `https://news.ycombinator.com/user?id=${targetUsername}`,
                username: data.id,
                details: `Karma: ${data.karma || 0} · Created: ${data.created ? new Date(data.created * 1000).toISOString().split('T')[0] : 'N/A'}`
              })
            } else {
              profiles.push({ platform: 'Hacker News', found: false, url: null, username: targetUsername })
            }
          } else {
            profiles.push({ platform: 'Hacker News', found: false, url: null, username: targetUsername })
          }
        })
        .catch(() => {
          profiles.push({ platform: 'Hacker News', found: false, url: null, username: targetUsername })
        })
    )
  }

  // Gravatar check (works with email)
  if (email) {
    tasks.push(
      (async () => {
        const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex')
        try {
          const res = await fetch(`https://gravatar.com/avatar/${hash}?d=404`, {
            signal: AbortSignal.timeout(5000)
          })
          if (res.ok) {
            gravatar = `https://gravatar.com/avatar/${hash}`
          }
        } catch {
          // Non-critical
        }
      })()
    )
  }

  await Promise.allSettled(tasks)

  // Sort: found first
  profiles.sort((a, b) => (b.found ? 1 : 0) - (a.found ? 1 : 0))

  return NextResponse.json({
    username: targetUsername,
    profiles,
    gravatar,
    totalFound: profiles.filter(p => p.found).length,
    totalChecked: profiles.length
  })
}
