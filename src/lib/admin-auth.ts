/**
 * Admin authentication utilities
 */
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type AdminSession = {
  id: string
  email: string
  name: string | null
}

/**
 * Get the current admin session.
 * Returns null if not authenticated or not admin.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await auth()
  if (!session?.user?.email) return null

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, name: true, role: true },
  })

  if (!user || user.role !== 'admin') return null

  return { id: user.id, email: user.email, name: user.name }
}

/**
 * Require admin auth - throws redirect if not admin.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdminSession()
  if (!admin) {
    const { redirect } = await import('next/navigation')
    redirect('/auth/login')
    throw new Error('UNREACHABLE')
  }
  return admin
}

/**
 * API route guard - returns Response if unauthorized, null if ok.
 */
export async function guardAdminApi(): Promise<Response | null> {
  const admin = await getAdminSession()
  if (!admin) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return null
}
