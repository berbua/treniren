import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { CreateTagSchema, formatValidationError } from '@/lib/validation';
import { applySecurity } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const tags = await prisma.tag.findMany({
      where: { userId: user.id },
    });
    
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = CreateTagSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationError(validationResult.error),
        },
        { status: 400 }
      );
    }
    
    const { name, color } = validationResult.data;
    
    const newTag = await prisma.tag.create({
      data: {
        name,
        color,
        userId: user.id,
      },
    });
    
    return NextResponse.json(newTag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
