import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  console.log('🔄 Auth callback received:', { code: !!code, next })

  if (code) {
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              console.error('Error setting cookies:', error)
            }
          },
        },
      }
    )

    try {
      console.log('🔑 Exchanging code for session...')
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('❌ Code exchange error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`)
      }

      if (data.user && data.session) {
        console.log('✅ User authenticated:', data.user.email)
        console.log('🍪 Session created:', !!data.session)
        
        // Check domain restriction
        if (!data.user.email?.endsWith('@carbonrobotics.com')) {
          console.log('🚫 Domain restriction failed for:', data.user.email)
          await supabase.auth.signOut()
          return NextResponse.redirect(`${requestUrl.origin}/unauthorized`)
        }

        // Create response with manual cookie setting as backup
        const response = NextResponse.redirect(`${requestUrl.origin}${next}`)
        
        // Set cookies manually as well to ensure they persist
        const maxAge = Math.floor((data.session.expires_at * 1000 - Date.now()) / 1000)
        
        response.cookies.set('sb-access-token', data.session.access_token, {
          path: '/',
          maxAge: maxAge,
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
        
        response.cookies.set('sb-refresh-token', data.session.refresh_token!, {
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })

        // Also set in a format the client can read
        response.cookies.set('supabase-auth-token', JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          user: data.user
        }), {
          path: '/',
          maxAge: maxAge,
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })

        console.log('🏠 Redirecting to:', next)
        console.log('🍪 Cookies set manually')
        
        return response
      } else {
        console.error('❌ No user or session data after successful code exchange')
        return NextResponse.redirect(`${requestUrl.origin}/login?error=no_user_data`)
      }
    } catch (err) {
      console.error('💥 Unexpected error in auth callback:', err)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=callback_error`)
    }
  }

  // No code provided
  console.log('❌ No code found, redirecting to login')
  return NextResponse.redirect(`${requestUrl.origin}/login?error=no_code`)
}