import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify the requester is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse request body
    const { email, password, role } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (role && role !== 'admin' && role !== 'user') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Create user with admin client
    const adminClient = await createAdminClient()

    // Use inviteUserByEmail to send invitation email instead of auto-confirming
    const { data: newUser, error: createError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        invited_role: role || 'user', // Store role in user metadata
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`
    })

    if (createError) {
      console.error('Error creating user:', createError)

      // Check for duplicate user error
      if (createError.message.includes('already registered') ||
          createError.message.includes('duplicate') ||
          createError.code === '23505') {
        return NextResponse.json({
          error: 'A user with this email already exists'
        }, { status: 400 })
      }

      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Create user profile
    // First check if profile already exists (might be auto-created by a trigger)
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', newUser.user.id)
      .single()

    if (!existingProfile) {
      // Profile doesn't exist, create it
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: newUser.user.id,
          email: email,
          role: role || 'user',
        })

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // If profile creation fails, we should delete the user
        await adminClient.auth.admin.deleteUser(newUser.user.id)
        return NextResponse.json({
          error: 'Failed to create user profile',
          details: profileError.message
        }, { status: 500 })
      }
    } else {
      // Profile exists (likely from trigger), just update the role
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: role || 'user' })
        .eq('id', newUser.user.id)

      if (updateError) {
        console.error('Error updating profile role:', updateError)
        return NextResponse.json({
          error: 'Failed to set user role',
          details: updateError.message
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Invite user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
