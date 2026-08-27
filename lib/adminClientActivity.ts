import { supabaseAdmin } from "@/lib/supabase-admin";

type ClientDogLink = {
  admin_dog_id: string;
  customer_clerk_user_id: string;
  customer_dog_profile_id: string | null;
};

type ClientSessionRow = {
  dog_profile_id: string | null;
  clerk_user_id: string;
  session_date: string | null;
  focus: string | null;
  wins: string | null;
  issues: string | null;
  created_at: string;
};

type ClientActivityRow = {
  dog_profile_id: string | null;
  clerk_user_id: string;
  output_type?: string | null;
  created_at: string;
};

export type AdminClientActivitySummary = {
  available: boolean;
  lastClientSession: { occurredAt: string; focus: string | null; result: string | null } | null;
  sessionsLast7Days: number;
  sessionsLast30Days: number;
  currentHomework: { focus: string; assignedAt: string } | null;
  lastTrainerActivityAt: string | null;
  daysSinceLastClientSession: number | null;
  activityStatus: string;
  recentActivities: Array<{ occurredAt: string; title: string; detail: string | null }>;
};

const unavailableSummary: AdminClientActivitySummary = {
  available: false,
  lastClientSession: null,
  sessionsLast7Days: 0,
  sessionsLast30Days: 0,
  currentHomework: null,
  lastTrainerActivityAt: null,
  daysSinceLastClientSession: null,
  activityStatus: "Client activity unavailable until the client account and dog profile are linked.",
  recentActivities: [],
};

const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());
const daysSince = (value: string, now = new Date()) => Math.max(0, Math.floor((startOfDay(now).getTime() - startOfDay(new Date(value)).getTime()) / 86_400_000));
const isForLinkedCustomerDog = (row: { dog_profile_id: string | null; clerk_user_id: string }, link: ClientDogLink) =>
  row.dog_profile_id === link.customer_dog_profile_id && row.clerk_user_id === link.customer_clerk_user_id;
const compactText = (value: string | null, maxLength = 160) => value?.trim() ? value.trim().slice(0, maxLength) : null;

const activityStatus = (lastActivityAt: string | null, lastSessionAt: string | null) => {
  if (!lastActivityAt) return "No client activity yet";
  const days = daysSince(lastActivityAt);
  if (days === 0) return "Active today";
  if (days <= 3) return "Recent activity";
  if (!lastSessionAt && days >= 7) return "No client sessions logged yet";
  return days >= 7 ? "No activity this week" : `Last activity ${days} days ago`;
};

export async function getAdminClientActivitySummaries(adminDogIds: string[]) {
  const uniqueAdminDogIds = [...new Set(adminDogIds.filter(Boolean))];
  const summaries = new Map<string, AdminClientActivitySummary>();
  uniqueAdminDogIds.forEach((dogId) => summaries.set(dogId, unavailableSummary));
  if (!uniqueAdminDogIds.length) return summaries;

  const { data: links, error: linkError } = await supabaseAdmin
    .from("admin_client_dog_links")
    .select("admin_dog_id, customer_clerk_user_id, customer_dog_profile_id")
    .in("admin_dog_id", uniqueAdminDogIds);

  if (linkError) {
    console.error("Admin client activity link load failed", { code: linkError.code, message: linkError.message });
    return summaries;
  }

  const linkedDogs = (links ?? []).filter((link): link is ClientDogLink => Boolean(link.customer_dog_profile_id));
  if (!linkedDogs.length) return summaries;
  const customerDogIds = [...new Set(linkedDogs.map((link) => link.customer_dog_profile_id!))];
  const [sessionResult, chatResult, outputResult, homeworkResult] = await Promise.all([
    supabaseAdmin.from("session_logs").select("dog_profile_id, clerk_user_id, session_date, focus, wins, issues, created_at").in("dog_profile_id", customerDogIds).order("created_at", { ascending: false }).limit(500),
    supabaseAdmin.from("dog_chats").select("dog_profile_id, clerk_user_id, created_at").in("dog_profile_id", customerDogIds).eq("role", "user").order("created_at", { ascending: false }).limit(250),
    supabaseAdmin.from("dog_outputs").select("dog_profile_id, clerk_user_id, output_type, created_at").in("dog_profile_id", customerDogIds).order("created_at", { ascending: false }).limit(250),
    supabaseAdmin.from("client_homework_context").select("customer_dog_profile_id, homework_focus, created_at").in("customer_dog_profile_id", customerDogIds).eq("active", true).order("created_at", { ascending: false }),
  ]);

  for (const result of [sessionResult, chatResult, outputResult, homeworkResult]) {
    if (result.error) {
      console.error("Admin client activity load failed", { code: result.error.code, message: result.error.message });
      return summaries;
    }
  }

  const sessions = (sessionResult.data ?? []) as ClientSessionRow[];
  const chats = (chatResult.data ?? []) as ClientActivityRow[];
  const outputs = (outputResult.data ?? []) as ClientActivityRow[];
  const homeworkRows = homeworkResult.data ?? [];
  const sevenDaysAgo = Date.now() - 7 * 86_400_000;

  linkedDogs.forEach((link) => {
    const dogSessions = sessions.filter((session) => isForLinkedCustomerDog(session, link));
    const dogChats = chats.filter((chat) => isForLinkedCustomerDog(chat, link));
    const dogOutputs = outputs.filter((output) => isForLinkedCustomerDog(output, link));
    const lastSession = dogSessions[0] ?? null;
    const homework = homeworkRows.find((row) => row.customer_dog_profile_id === link.customer_dog_profile_id) ?? null;
    const activities = [
      ...dogSessions.map((session) => ({ occurredAt: session.created_at, title: "Logged training session", detail: session.focus || "Training" })),
      ...dogChats.map((chat) => ({ occurredAt: chat.created_at, title: "Asked AI Coach", detail: null })),
      ...dogOutputs.map((output) => ({ occurredAt: output.created_at, title: output.output_type === "next_session_plan" ? "Generated next training session" : "Generated training session", detail: null })),
    ].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    const lastTrainerActivityAt = activities[0]?.occurredAt ?? null;
    const lastSessionAt = lastSession?.session_date || lastSession?.created_at || null;

    summaries.set(link.admin_dog_id, {
      available: true,
      lastClientSession: lastSession ? {
        occurredAt: lastSessionAt!,
        focus: lastSession.focus,
        result: compactText(lastSession.wins) ?? compactText(lastSession.issues),
      } : null,
      sessionsLast7Days: dogSessions.filter((session) => new Date(session.created_at).getTime() >= sevenDaysAgo).length,
      sessionsLast30Days: dogSessions.length,
      currentHomework: homework ? { focus: homework.homework_focus, assignedAt: homework.created_at } : null,
      lastTrainerActivityAt,
      daysSinceLastClientSession: lastSessionAt ? daysSince(lastSessionAt) : null,
      activityStatus: activityStatus(lastTrainerActivityAt, lastSessionAt),
      recentActivities: activities.slice(0, 5),
    });
  });

  return summaries;
}
