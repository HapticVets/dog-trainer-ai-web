import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    dogProfilesResult,
    sessionLogsResult,
    outputsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("dog_profiles")
      .select("*")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("session_logs")
      .select("*")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("dog_outputs")
      .select("*")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (dogProfilesResult.error) {
    return NextResponse.json(
      { error: dogProfilesResult.error.message },
      { status: 500 }
    );
  }

  if (sessionLogsResult.error) {
    return NextResponse.json(
      { error: sessionLogsResult.error.message },
      { status: 500 }
    );
  }

  if (outputsResult.error) {
    return NextResponse.json(
      { error: outputsResult.error.message },
      { status: 500 }
    );
  }

  const dogProfiles = dogProfilesResult.data ?? [];
  const sessionLogs = sessionLogsResult.data ?? [];
  const outputs = outputsResult.data ?? [];

  const latestDog = dogProfiles[0] ?? null;
  const latestSession = sessionLogs[0] ?? null;
  const latestProgressReport =
    outputs.find((item) => item.output_type === "progress_report") ?? null;
  const latestNextSessionPlan =
    outputs.find((item) => item.output_type === "next_session_plan") ?? null;

  return NextResponse.json({
    totalDogs: dogProfiles.length,
    totalSessions: sessionLogs.length,
    latestDog,
    latestSession,
    latestProgressReport,
    latestNextSessionPlan,
  });
}