// Active un compte via le jeton reçu par email, puis redirige vers /verify-email.
import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { consumeVerificationToken } from '@/lib/services/emailVerification'

export async function GET(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
  try {
    const limited = applyRateLimit(request, 'verify-email', RATE_LIMITS.api)
    if (limited) return limited

    const token = new URL(request.url).searchParams.get('token') || ''
    const ok = await consumeVerificationToken(token)
    return NextResponse.redirect(new URL(`/verify-email?status=${ok ? 'success' : 'invalid'}`, base))
  } catch (error) {
    console.error('❌ verify-email:', error)
    return NextResponse.redirect(new URL('/verify-email?status=error', base))
  }
}
