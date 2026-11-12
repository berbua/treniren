import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { SITE_GATE_COOKIE, SITE_GATE_MAX_AGE, siteGateToken } from '@/lib/site-gate'

// Own key prefix, so wrong gate passwords don't use up the login attempts of the same IP
const gateRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyGenerator: (request) =>
    `gate:${request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'}`,
})

// POST /api/gate - check the site password and remember the visitor with a cookie
export async function POST(request: NextRequest) {
  const sitePassword = process.env.SITE_PASSWORD
  if (!sitePassword) {
    return NextResponse.json({ ok: true })
  }

  const limit = await gateRateLimit(request)
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many attempts', code: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': Math.ceil((limit.resetTime - Date.now()) / 1000).toString() } }
    )
  }

  const body = await request.json().catch(() => null)
  const password = typeof body?.password === 'string' ? body.password : ''

  // Compare HMACs, not the raw strings, so the comparison time says nothing about the password
  const [expected, given] = await Promise.all([siteGateToken(sitePassword), siteGateToken(password)])
  if (given !== expected) {
    return NextResponse.json({ error: 'Wrong password', code: 'WRONG_PASSWORD' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SITE_GATE_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SITE_GATE_MAX_AGE,
    path: '/',
  })
  return response
}
