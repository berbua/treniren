import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEmail } from '@/lib/auth-utils'
import { applySecurity } from '@/lib/api-security'
import { findUserByEmail } from '@/lib/auth'
import { isEmailConfigured, sendPasswordResetEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

const GENERIC_RESPONSE = { message: 'If the email exists, a password reset link has been sent' }

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const securityResponse = await applySecurity(request, { rateLimit: 'auth', csrf: false, requireAuth: false })
    if (securityResponse) return securityResponse

    const { email, language } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Say so instead of claiming a link was sent (checked before the lookup, so it reveals nothing about accounts)
    if (!isEmailConfigured()) {
      console.error('Password reset requested but EMAIL_SERVER_* is not configured')
      return NextResponse.json(
        { error: 'Password reset by email is not available right now' },
        { status: 503 }
      )
    }

    const user = await findUserByEmail(email)

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 })
    }

    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour

    // Only the newest link works: drop links from earlier requests
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { email: user.email } }),
      prisma.passwordResetToken.create({ data: { email: user.email, token, expires } }),
    ])

    // NEXTAUTH_URL rather than the request's Host header, which the client controls
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
    const resetLink = `${baseUrl}/auth/reset-password?token=${token}`

    try {
      await sendPasswordResetEmail(user.email, resetLink, language === 'en' ? 'en' : 'pl')
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      await prisma.passwordResetToken.deleteMany({ where: { token } })
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 500 }
      )
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 })
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
