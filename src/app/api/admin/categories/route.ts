import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardAdminApi } from '@/lib/admin-auth'

export async function GET() {
  const unauthorized = await guardAdminApi()
  if (unauthorized) return unauthorized

  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { books: true } },
      },
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await guardAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const { id, name, nameEn, parentId } = body

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, name' },
        { status: 400 }
      )
    }

    const existing = await prisma.category.findUnique({ where: { id } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Category with this id already exists' },
        { status: 409 }
      )
    }

    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } })
      if (!parent) {
        return NextResponse.json(
          { success: false, error: 'Parent category not found' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.category.create({
      data: { id, name, nameEn, parentId },
    })

    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
