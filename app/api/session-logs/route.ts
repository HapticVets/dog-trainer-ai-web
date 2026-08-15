import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getTrainerAccess } from '@/app/lib/trainer-access'
import { createDogTimelineEvent, recordConsistencyThresholds } from '@/lib/dogTimeline'
import { getOwnedCustomerDog, getOwnedCustomerDogIds } from '@/lib/customerDogProfiles'

export async function GET(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dogName = request.nextUrl.searchParams.get('dog_name')
  const customerDogIds = await getOwnedCustomerDogIds(userId)

  if (customerDogIds.length === 0) {
    return NextResponse.json({ logs: [] })
  }

  let query = supabaseAdmin
    .from('session_logs')
    .select('*')
    .eq('clerk_user_id', userId)
    .in('dog_profile_id', customerDogIds)
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

  if (typeof body.dog_profile_id !== 'string' || !body.dog_profile_id || !await getOwnedCustomerDog(userId, body.dog_profile_id)) {
    return NextResponse.json({ error: 'Dog profile not found' }, { status: 404 })
  }

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
        dog_profile_id:
          typeof body.dog_profile_id === 'string' && body.dog_profile_id
            ? body.dog_profile_id
            : null,
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

  const { data: log, error: logError } = await supabaseAdmin
    .from('session_logs')
    .select('id, dog_profile_id')
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 })
  }

  if (!log?.dog_profile_id || !await getOwnedCustomerDog(userId, log.dog_profile_id)) {
    return NextResponse.json({ error: 'Session log not found' }, { status: 404 })
  }

  const { error } = await supabaseAdmin
    .from('session_logs')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId)
    .eq('dog_profile_id', log.dog_profile_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
