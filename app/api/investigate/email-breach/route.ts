import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 })
    }

    // Call XposedOrNot analytics API
    const response = await fetch(`https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`, {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      // 404 means no breaches found, which is a success state for the user
      if (response.status === 404) {
        return NextResponse.json({ breaches: [] })
      }
      throw new Error(`XposedOrNot API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Extract the breach details
    const breaches = data.ExposedBreaches?.breaches_details || []
    
    return NextResponse.json({
      breaches: breaches.map((b: any) => ({
        name: b.breach,
        date: b.xposed_date,
        data_exposed: b.xposed_data ? b.xposed_data.split(';') : [],
        records: b.xposed_records,
        description: b.details,
        logo: b.logo,
        password_risk: b.password_risk
      })),
      pastes: data.PastesSummary?.cnt || 0
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch breach data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
