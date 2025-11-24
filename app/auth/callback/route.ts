import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const type = requestUrl.searchParams.get('type')

  console.log('[Auth Callback] Query params:', {
    code: code ? 'present' : 'missing',
    type,
    next,
    fullUrl: requestUrl.toString()
  })

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user details to check if they need to set password
      const { data: { user } } = await supabase.auth.getUser()

      console.log('[Auth Callback] User authenticated:', {
        email: user?.email,
        hasPassword: user?.app_metadata?.provider === 'email',
        userMetadata: user?.user_metadata,
        appMetadata: user?.app_metadata,
        type
      })

      // Check multiple conditions to determine if this is an invite:
      // 1. type parameter is 'invite' or 'signup'
      // 2. User has invited_role in user_metadata
      // 3. User doesn't have a password yet (check via profile)
      const isInvite = type === 'invite' ||
                       type === 'signup' ||
                       user?.user_metadata?.invited_role

      if (isInvite) {
        console.log('[Auth Callback] Redirecting to set-password')
        return NextResponse.redirect(new URL('/set-password', request.url))
      }

      // Regular auth, redirect to next URL
      console.log('[Auth Callback] Regular auth, redirecting to:', next)
      return NextResponse.redirect(new URL(next, request.url))
    } else {
      console.error('[Auth Callback] Session exchange error:', error)
    }
  }

  // Auth failed, redirect to login with error
  console.log('[Auth Callback] Auth failed, redirecting to login')
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
}
