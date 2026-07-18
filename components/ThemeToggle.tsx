'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [spinning, setSpinning] = useState(false)

  // On mount, check localStorage for saved preference (default: dark)
  useEffect(() => {
    const saved = localStorage.getItem('ip-lookup-theme') as 'dark' | 'light' | null
    const initial = saved || 'dark'
    setTheme(initial)
    if (initial === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  const toggleTheme = () => {
    setSpinning(true)
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('ip-lookup-theme', next)

    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }

    setTimeout(() => setSpinning(false), 500)
  }

  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className={`theme-toggle-icon ${spinning ? 'spin' : ''}`}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </span>
    </button>
  )
}
