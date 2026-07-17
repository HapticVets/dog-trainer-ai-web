import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getDefaultMainGoal, normalizeGoalType } from '@/lib/dogGoals'
import { getTrainerAccess } from '@/app/lib/trainer-access'

const DOG_PROFILE_IMAGES_BUCKET = 'dog-profile-images'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('dog_profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase GET dog_profiles error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    const profiles = await Promise.all(
      (data ?? []).map(async (profile) => {
        if (!profile.profile_image_path) {
          return { ...profile, profile_image_url: null }
        }

        const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
          .from(DOG_PROFILE_IMAGES_BUCKET)
          .createSignedUrl(profile.profile_image_path, 60 * 60)

        if (signedUrlError) {
          console.error('Supabase dog profile image signing error:', signedUrlError)
          return { ...profile, profile_image_url: null }
        }

        return { ...profile, profile_image_url: signedUrlData.signedUrl }
      })
    )

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('GET /api/dog-profile crashed:', error)
    return NextResponse.json({ error: 'Server crashed loading dog profiles' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const normalizedGoalType = normalizeGoalType(body.goalType)

    const payload = {
      clerk_user_id: userId,
      name: body.name ?? '',
      goal_type: normalizedGoalType,
      main_goal: body.mainGoal ?? getDefaultMainGoal(normalizedGoalType),
      reward_type: body.rewardType ?? 'Food',
      skill_level: body.skillLevel ?? 'Beginner',
      custom_notes: body.customNotes ?? '',
      updated_at: new Date().toISOString(),
    }

    if (!payload.name.trim()) {
      return NextResponse.json({ error: 'Dog name is required' }, { status: 400 })
    }

    if (body.id) {
      const { data, error } = await supabaseAdmin
        .from('dog_profiles')
        .update(payload)
        .eq('id', body.id)
        .eq('clerk_user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Supabase UPDATE dog_profiles error:', error)
        return NextResponse.json({ error: error.message, details: error }, { status: 500 })
      }

      return NextResponse.json({ profile: data })
    }

    const access = await getTrainerAccess(userId)

    if (!access.canCreateCaseFile) {
      return NextResponse.json(
        {
          error:
            "The free plan includes one dog profile. Upgrade to add more dogs, generate ongoing sessions, and unlock unlimited AI coaching.",
          requiresUpgrade: true,
        },
        { status: 403 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('dog_profiles')
      .insert([payload])
      .select()
      .single()

    if (error) {
      console.error('Supabase INSERT dog_profiles error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error('POST /api/dog-profile crashed:', error)
    return NextResponse.json({ error: 'Server crashed saving dog profile' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('dog_profiles')
      .select('profile_image_path')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('Supabase SELECT dog_profiles error:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Dog profile not found' }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from('dog_profiles')
      .delete()
      .eq('id', id)
      .eq('clerk_user_id', userId)

    if (error) {
      console.error('Supabase DELETE dog_profiles error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    if (profile.profile_image_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(DOG_PROFILE_IMAGES_BUCKET)
        .remove([profile.profile_image_path])

      if (storageError) {
        console.error('Supabase DELETE dog profile image error:', storageError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/dog-profile crashed:', error)
    return NextResponse.json({ error: 'Server crashed deleting dog profile' }, { status: 500 })
  }
}
