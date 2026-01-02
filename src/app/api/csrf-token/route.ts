// GET /api/csrf-token - Get CSRF token for client-side requests
import { NextRequest, NextResponse } from 'next/server'
import { getCsrfToken } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  try {
    const token = await getCsrfToken()
    
    return NextResponse.json({ csrfToken: token })
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}

