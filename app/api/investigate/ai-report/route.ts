import { NextRequest, NextResponse } from 'next/server'

/**
 * AI Report Generation via Mistral Large 3 on NVIDIA NIM.
 * Takes correlated OSINT data and generates a professional investigation report.
 */

const NIM_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
const MODEL = 'meta/llama-3.1-70b-instruct'

const SYSTEM_PROMPT = `You are an elite OSINT (Open Source Intelligence) investigator and cyber intelligence analyst with 15+ years of experience. Your task is to analyze BOTH the raw data from various OSINT APIs and the pre-correlated findings to generate an extremely detailed, professional, step-by-step investigation report.

REPORT STRUCTURE:
You MUST format your report exactly with these markdown sections and headers:

## EXECUTIVE SUMMARY
Write a highly detailed 2-3 paragraph summary. State the risk level (GREEN / YELLOW / RED), summarize the target, the scope of the investigation, and the most critical findings. Be direct, authoritative, and actionable.

## TARGET PROFILE
Detail exactly what we know about the target: 
- Type (email/IP/domain/username)
- Associated infrastructure, ownership, registration info (from WHOIS or similar)
- Geolocation data (if applicable)

## DEEP-DIVE ANALYSIS & KEY FINDINGS
This is the core of the report. Go through the raw data and correlated data step-by-step.
Number each finding. For each finding:
- **Finding:** State the finding clearly with actual data points (e.g. IPs, domain names, breach names).
- **Security Implication:** Explain deeply WHY it matters and what it could be used for by an adversary.
- **Source Context:** Reference the exact data source (e.g. XposedOrNot, HackerTarget, WHOIS).
- **Severity:** Rate severity: [CRITICAL] [HIGH] [MEDIUM] [LOW] [INFO]

## DATA BREACHES & EXPOSURES
List all data breaches the target is involved in. Name the breaches, the date, and the specific data types exposed (e.g. passwords, emails, names). Explain the risk of these specific exposures. If none, state "No known breaches detected."

## INFRASTRUCTURE MAP
Map all connected infrastructure discovered:
- Document all IPs, domains, nameservers (NS), mail servers (MX), and DNS records.
- Document SSL certificates and relationships.
- Detail the hosting providers and ASN information.
Show the logical connections between elements in a readable list format.

## CHRONOLOGICAL EVENT TIMELINE
Reconstruct a timeline of events based on dates in the raw data (domain registration, certificate issuance, data breaches, etc.). Use YYYY-MM-DD or YYYY format.

## RISK ASSESSMENT & THREAT MODEL
- Overall risk level with deep justification.
- Provide a threat model: What is the attack surface? What is the exposure? What is the likely impact if an attacker targets this entity?

## INVESTIGATION LEADS & NEXT STEPS
Provide concrete, specific next steps an investigator should take based on these findings. Mention specific follow-up queries, databases to check, or patterns to look for. 

## ACTIONABLE RECOMMENDATIONS
Actionable security recommendations based on the findings, prioritized by impact.
Map out the timeline of the target based on raw API dates (WHOIS creation, DNS updates, Breach dates). Group them chronologically and explain the progression.

## THREAT MODEL & RECOMMENDATIONS
Conclude with a professional threat assessment and 3-5 concrete, actionable recommendations for a security team handling this target.`

export async function POST(request: NextRequest) {
  const apiKey = process.env.NVIDIA_NIM_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'NVIDIA NIM API key not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { target, targetType, correlatedData, rawData } = body

    if (!target || !correlatedData) {
      return NextResponse.json(
        { error: 'Missing target or correlated data' },
        { status: 400 }
      )
    }

    // Build the user prompt with all investigation data, explicitly passing raw data for deep analysis
    const userPrompt = `Generate an elite, step-by-step OSINT investigation report for the following target.

TARGET: ${target}
TYPE: ${targetType?.toUpperCase() || 'UNKNOWN'}
INVESTIGATION DATE: ${new Date().toISOString().split('T')[0]}

=== RAW API DATA ===
(Analyze this deeply for specific details, dates, and identifiers)
${JSON.stringify(rawData)}

=== CORRELATED DATA ===
(Use this as a baseline for your analysis)
${JSON.stringify(correlatedData)}

Write the full, detailed investigation report now, strictly adhering to the requested markdown sections and format.`

    const response = await fetch(NIM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
        top_p: 0.9,
        stream: true,
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('NIM API error:', response.status, errorText)
      return NextResponse.json(
        { error: `AI generation failed (${response.status})`, fallback: true },
        { status: 502 }
      )
    }

    // Stream the response back to the client directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI report generation failed'
    console.error('AI report error:', message)
    return NextResponse.json(
      { error: message, fallback: true },
      { status: 500 }
    )
  }
}
