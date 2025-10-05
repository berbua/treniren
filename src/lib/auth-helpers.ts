import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from './prisma'

export async function getCurrentUser(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token?.id) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      }
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser(request)
  
  if (!user) {
    return null
  }
  
  return user
}
