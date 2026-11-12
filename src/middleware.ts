import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { SITE_GATE_COOKIE, isGateExempt, siteGateToken } from '@/lib/site-gate'

export async function middleware(request: NextRequest) {
  // Site password gate in front of everything (only when SITE_PASSWORD is set)
  const sitePassword = process.env.SITE_PASSWORD
  const { pathname, search } = request.nextUrl
  if (sitePassword && !isGateExempt(pathname)) {
    const passed = request.cookies.get(SITE_GATE_COOKIE)?.value === await siteGateToken(sitePassword)
    if (!passed) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Site password required' }, { status: 401 })
      }
      const gateUrl = new URL('/gate', request.url)
      gateUrl.searchParams.set('next', pathname + search)
      return NextResponse.redirect(gateUrl)
    }
  }

  // API routes check the session themselves (requireAuth) and return specific errors
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Static files from public/ (sw.js, manifest.json, icons, ...) must load without a session
  if (/\.[^/]+$/.test(pathname)) {
    return NextResponse.next()
  }

  // Every other page needs a session, except the landing page and the auth pages.
  // '/' is matched exactly: as a prefix it would make every route public.
  const isPublicPage = pathname === '/' || PUBLIC_PAGE_PREFIXES.some(prefix =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  if (isPublicPage) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  return NextResponse.next()
}

const PUBLIC_PAGE_PREFIXES = ['/auth', '/gate']

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
