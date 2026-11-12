import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePassword } from '@/lib/auth-utils'

// GET /api/auth/reset-password?token=… - Check a reset link when the page opens: { valid, expired }
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ valid: false, expired: false })
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      select: { expires: true },
    })

    if (!resetToken) {
      return NextResponse.json({ valid: false, expired: false })
    }

    const expired = resetToken.expires < new Date()
    return NextResponse.json({ valid: !expired, expired })
  } catch (error) {
    console.error('Error checking reset token:', error)
    return NextResponse.json({ error: 'Failed to check reset token' }, { status: 500 })
  }
}

// POST /api/auth/reset-password - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password validation failed', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)

    // Claim the token and change the password together. Deleting by token first makes the link single-use
    // even for two simultaneous submits, and deleting every token for the email retires older links too.
    const used = await prisma.$transaction(async (tx) => {
      const claimed = await tx.passwordResetToken.deleteMany({ where: { token } })
      if (claimed.count === 0) return false
      await tx.passwordResetToken.deleteMany({ where: { email: resetToken.email } })
      await tx.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword }
      })
      return true
    })

    if (!used) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
