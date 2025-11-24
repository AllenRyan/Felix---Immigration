import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// IMPORTANT: This is a temporary endpoint for development only
// Remove this in production!
export async function POST() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        userError
      }, { status: 401 })
    }

    // Update user role to admin
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()

    if (error) {
      console.error('Error updating role:', error)
      return NextResponse.json({
        error: 'Failed to update role',
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `User ${user.email} is now an admin`,
      profile: data[0]
    })
  } catch (error) {
    console.error('Error making admin:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error
    }, { status: 500 })
  }
}
