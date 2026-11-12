import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { applySecurity } from '@/lib/api-security'

// DELETE /api/plans/[id] - Remove a planned session (workouts logged from it are kept; their planId is cleared)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const securityResponse = await applySecurity(request, { rateLimit: 'normal', csrf: true })
    if (securityResponse) return securityResponse

    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const { count } = await prisma.plan.deleteMany({ where: { id, userId: user.id } })
    if (count === 0) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 })
  }
}
