import { NextResponse } from 'next/server'
import { categories } from '@/lib/seed-data'

export async function GET() {
  return NextResponse.json({ success: true, data: categories })
}
