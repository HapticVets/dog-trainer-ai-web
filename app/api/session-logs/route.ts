import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTrainerAccess } from '@/app/lib/trainer-access'
import { createDogTimelineEvent, recordConsistencyThresholds } from '@/lib/dogTimeline'

export async function GET(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dogName = request.nextUrl.searchParams.get('dog_name')

  let query = supabaseAdmin
    .from('session_logs')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })

  if (dogName) {
    query = query.eq('dog_name', dogName)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ logs: data ?? [] })
}

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const access = await getTrainerAccess(userId)

  if (!access.canLogSession) {
    return NextResponse.json(
      {
        error: "Upgrade to continue training. Free access includes one session log.",
        requiresUpgrade: true,
      },
      { status: 403 }
    )
  }

  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('session_logs')
    .insert([
      {
        clerk_user_id: userId,
        dog_name: body.dog_name,
        goal_type: body.goal_type,
        main_goal: body.main_goal,
        reward_type: body.reward_type,
        skill_level: body.skill_level,
        custom_notes: body.custom_notes,
        session_date: body.session_date,
        duration: body.duration,
        focus: body.focus,
        wins: body.wins,
        issues: body.issues,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (typeof body.dog_profile_id === 'string' && body.dog_profile_id) {
    await createDogTimelineEvent({
      userId,
      dogId: body.dog_profile_id,
      eventType: 'session_logged',
      title: 'Training Session Logged',
      summary: `Completed a${data.duration ? ` ${data.duration}-minute` : ''} session focused on ${data.focus || 'training'}.`,
      metadata: {
        duration: data.duration,
        focus: data.focus,
        wins: data.wins,
        issues: data.issues,
        session_date: data.session_date,
      },
      sourceType: 'session_log',
      sourceId: data.id,
      occurredAt: data.created_at,
    })

    await recordConsistencyThresholds({
      userId,
      dogId: body.dog_profile_id,
      dogName: data.dog_name,
    })
  }

  return NextResponse.json({ log: data })
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('session_logs')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
