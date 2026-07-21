import { supabaseAdmin } from "@/lib/supabase-admin";
import { getTrainingConsistency } from "@/lib/trainingConsistency";

export const dogTimelineEventTypes = [
  "profile_created",
  "session_logged",
  "goal_updated",
  "consistency_update",
  "assessment_completed",
  "phase_updated",
  "progress_update",
  "milestone_reached",
  "profile_updated",
] as const;

export type DogTimelineEventType = (typeof dogTimelineEventTypes)[number];
export type DogTimelineFilter = "all" | "sessions" | "progress" | "goals" | "case-file";

type TimelineMetadata = Record<string, string | number | boolean | null | undefined>;

type CreateDogTimelineEventInput = {
  userId: string;
  dogId: string;
  eventType: DogTimelineEventType;
  title: string;
  summary?: string;
  metadata?: TimelineMetadata;
  sourceType?: string;
  sourceId?: string;
  occurredAt?: string;
};

type TimelineCursor = {
  occurredAt: string;
  id: string;
};

const filterEventTypes: Record<DogTimelineFilter, readonly DogTimelineEventType[]> = {
  all: dogTimelineEventTypes,
  sessions: ["session_logged"],
  progress: [
    "progress_update",
    "phase_updated",
    "assessment_completed",
    "milestone_reached",
    "consistency_update",
  ],
  goals: ["goal_updated"],
  "case-file": ["profile_created", "profile_updated"],
};

const normalizeMetadata = (metadata: TimelineMetadata = {}) =>
  Object.fromEntries(
    Object.entries(metadata).filter(([, value]) =>
      ["string", "number", "boolean"].includes(typeof value) || value === null,
    ),
  );

const getOwnedDog = async (userId: string, dogId: string) => {
  const { data, error } = await supabaseAdmin
    .from("dog_profiles")
    .select("id, name, main_goal, goal_type, reward_type, skill_level, custom_notes, created_at")
    .eq("id", dogId)
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

export const createDogTimelineEvent = async (input: CreateDogTimelineEventInput) => {
  try {
    if (!dogTimelineEventTypes.includes(input.eventType)) {
      throw new Error(`Unsupported dog timeline event type: ${input.eventType}`);
    }

    const dog = await getOwnedDog(input.userId, input.dogId);
    if (!dog) {
      throw new Error("Dog profile was not found for the authenticated user.");
    }

    const { error } = await supabaseAdmin.from("dog_timeline_events").insert({
      clerk_user_id: input.userId,
      dog_id: input.dogId,
      event_type: input.eventType,
      title: input.title,
      summary: input.summary ?? null,
      metadata: normalizeMetadata(input.metadata),
      source_type: input.sourceType ?? null,
      source_id: input.sourceId ?? null,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    });

    if (error && error.code !== "23505") {
      throw new Error(error.message);
    }
  } catch (error) {
    // Timeline recording is supplementary and must never invalidate completed training work.
    console.error("Unable to record dog timeline event:", error);
  }
};

const getWeekKey = (date = new Date()) => {
  const start = new Date(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start.toISOString().slice(0, 10);
};

export const recordConsistencyThresholds = async ({
  userId,
  dogId,
  dogName,
}: {
  userId: string;
  dogId: string;
  dogName: string;
}) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("session_logs")
      .select("session_date, created_at, duration")
      .eq("clerk_user_id", userId)
      .eq("dog_name", dogName);

    if (error) throw new Error(error.message);

    const consistency = getTrainingConsistency(
      (data ?? []).map((session) => ({
        date: session.session_date,
        createdAt: session.created_at,
        duration: session.duration,
      })),
    );
    const threshold = consistency.currentWeekSessions === 5 ? 5 : consistency.currentWeekSessions === 3 ? 3 : null;
    if (!threshold) return;

    await createDogTimelineEvent({
      userId,
      dogId,
      eventType: "consistency_update",
      title: threshold === 5 ? "Strong Training Consistency" : "Consistent Training Routine",
      summary:
        threshold === 5
          ? "Completed 5 focused sessions this week."
          : "Completed 3 focused sessions this week.",
      metadata: {
        sessions_this_week: consistency.currentWeekSessions,
        status: consistency.status,
      },
      sourceType: "consistency-week",
      sourceId: `${getWeekKey()}:${threshold}`,
    });
  } catch (error) {
    console.error("Unable to record dog training consistency threshold:", error);
  }
};

export const backfillDogTimeline = async (userId: string, dogId: string) => {
  try {
    const dog = await getOwnedDog(userId, dogId);
    if (!dog) return;

    await createDogTimelineEvent({
      userId,
      dogId,
      eventType: "profile_created",
      title: "Case File Created",
      summary: `${dog.name}'s training record was created.`,
      metadata: { primary_goal: dog.main_goal, goal_type: dog.goal_type },
      sourceType: "dog_profile",
      sourceId: dog.id,
      occurredAt: dog.created_at,
    });

    const { data: sessions, error } = await supabaseAdmin
      .from("session_logs")
      .select("id, session_date, created_at, duration, focus, wins, issues")
      .eq("clerk_user_id", userId)
      .eq("dog_name", dog.name);
    if (error) throw new Error(error.message);

    for (const session of sessions ?? []) {
      await createDogTimelineEvent({
        userId,
        dogId,
        eventType: "session_logged",
        title: "Training Session Logged",
        summary: `Completed a${session.duration ? ` ${session.duration}-minute` : ""} session focused on ${session.focus || "training"}.`,
        metadata: {
          duration: session.duration,
          focus: session.focus,
          wins: session.wins,
          issues: session.issues,
          session_date: session.session_date,
        },
        sourceType: "session_log",
        sourceId: session.id,
        occurredAt: session.created_at || session.session_date,
      });
    }
  } catch (error) {
    console.error("Unable to backfill dog timeline:", error);
  }
};

const decodeCursor = (cursor?: string | null): TimelineCursor | null => {
  if (!cursor) return null;
  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as TimelineCursor;
    return decoded.occurredAt && decoded.id ? decoded : null;
  } catch {
    return null;
  }
};

const encodeCursor = (cursor: TimelineCursor) =>
  Buffer.from(JSON.stringify(cursor)).toString("base64url");

export const getDogTimelineEvents = async ({
  userId,
  dogId,
  filter = "all",
  cursor,
  limit = 20,
}: {
  userId: string;
  dogId: string;
  filter?: DogTimelineFilter;
  cursor?: string | null;
  limit?: number;
}) => {
  const dog = await getOwnedDog(userId, dogId);
  if (!dog) throw new Error("Dog profile was not found for the authenticated user.");

  const decodedCursor = decodeCursor(cursor);
  let query = supabaseAdmin
    .from("dog_timeline_events")
    .select("id, event_type, title, summary, metadata, source_type, source_id, occurred_at")
    .eq("clerk_user_id", userId)
    .eq("dog_id", dogId)
    .in("event_type", filterEventTypes[filter])
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 20) + 1);

  if (decodedCursor) {
    query = query.or(
      `occurred_at.lt.${decodedCursor.occurredAt},and(occurred_at.eq.${decodedCursor.occurredAt},id.lt.${decodedCursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const events = hasMore ? rows.slice(0, limit) : rows;
  const finalEvent = events.at(-1);

  return {
    events,
    nextCursor:
      hasMore && finalEvent
        ? encodeCursor({ occurredAt: finalEvent.occurred_at, id: finalEvent.id })
        : null,
  };
};
