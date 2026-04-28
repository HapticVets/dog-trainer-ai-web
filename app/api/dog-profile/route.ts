import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    return NextResponse.json({ profiles: data ?? [] })
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

    const payload = {
      clerk_user_id: userId,
      name: body.name ?? '',
      goal_type: body.goalType ?? 'Obedience',
      main_goal: body.mainGoal ?? 'Heel position',
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

    const { error } = await supabaseAdmin
      .from('dog_profiles')
      .delete()
      .eq('id', id)
      .eq('clerk_user_id', userId)

    if (error) {
      console.error('Supabase DELETE dog_profiles error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/dog-profile crashed:', error)
    return NextResponse.json({ error: 'Server crashed deleting dog profile' }, { status: 500 })
  }
}