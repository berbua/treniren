import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePassword, validateEmail } from '@/lib/auth-utils'
import { applySecurity } from '@/lib/api-security'
import { sanitizeEmail, sanitizeString } from '@/lib/sanitize'

// POST /api/auth/register - Register a new user
export async function POST(request: NextRequest) {
  try {
    // Apply security middleware (strict rate limit for auth)
    const securityResponse = await applySecurity(request, { rateLimit: 'auth', csrf: false, requireAuth: false })
    if (securityResponse) return securityResponse

    const body = await request.json()
    
    // Sanitize inputs
    const email = sanitizeEmail(body.email)
    const password = body.password // Don't sanitize password, but validate
    const name = sanitizeString(body.name, 100)

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        emailVerified: new Date(), // For MVP, auto-verify emails
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
