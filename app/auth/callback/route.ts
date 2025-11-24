import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if this is an invite (user needs to set password)
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.user_metadata?.invited_role) {
        // User was invited, redirect to set-password page
        return NextResponse.redirect(new URL('/set-password', request.url))
      }

      // Regular auth, redirect to next URL
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // Auth failed, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
}
