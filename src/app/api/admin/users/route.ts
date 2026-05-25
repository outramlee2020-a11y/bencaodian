import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardAdminApi } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const unauthorized = await guardAdminApi()
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 200)
  const offset = Number(searchParams.get('offset') || '0')

  try {
    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          createdAt: true,
          _count: {
            select: {
              bookmarks: true,
              histories: true,
              notes: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: { total, offset, limit },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
