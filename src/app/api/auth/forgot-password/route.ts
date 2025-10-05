import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateEmail } from '@/lib/auth-utils'
import { randomBytes } from 'crypto'

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: 'If the email exists, a password reset link has been sent' },
        { status: 200 }
      )
    }

    // Generate reset token
    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour

    // Store reset token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      }
    })

    // TODO: Send email with reset link
    // For now, we'll just return success
    console.log(`Password reset token for ${email}: ${token}`)
    console.log(`Reset link: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`)

    return NextResponse.json(
      { message: 'If the email exists, a password reset link has been sent' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error requesting password reset:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
