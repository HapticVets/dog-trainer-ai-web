import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildDogCaseFileContext, hydrateDogCaseFile } from "@/lib/dogCaseFile";
import { buildPatriotK9DoctrinePrompt } from "@/lib/patriotK9Protocols";
import { supabaseAdmin } from "@/lib/supabase-admin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const internalRecordTypes = ["personal", "client", "breeding"];

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const userId = await requireAdmin();
    const { id } = await params;
    const { data: dog, error: dogError } = await supabaseAdmin
      .from("dog_profiles")
      .select("id, name, goal_type, main_goal, reward_type, skill_level, custom_notes, record_type")
      .eq("id", id)
      .in("record_type", internalRecordTypes)
      .maybeSingle();

    if (dogError || !dog) return NextResponse.json({ error: "Internal dog record not found." }, { status: 404 });

    const [notesResult, sessionsResult] = await Promise.all([
      supabaseAdmin.from("admin_dog_notes").select("note, created_at").eq("dog_id", id).order("created_at", { ascending: false }).limit(5),
      supabaseAdmin.from("admin_training_sessions").select("session_number, title, objectives, progression_goal, what_went_well, challenges, recovery_notes, homework, outcome, completed_at").eq("dog_id", id).eq("status", "completed").order("completed_at", { ascending: false }).limit(5),
    ]);

    if (notesResult.error || sessionsResult.error) {
      console.error("Admin session context load error:", notesResult.error ?? sessionsResult.error);
      return NextResponse.json({ error: "Unable to load internal training context." }, { status: 500 });
    }

    const profile = hydrateDogCaseFile(dog);
    const completedSessions = sessionsResult.data ?? [];
    const notes = notesResult.data ?? [];
    const history = completedSessions.length
      ? completedSessions.map((session) => `Session ${session.session_number}: ${session.title}\nObjectives: ${session.objectives}\nProgression goal: ${session.progression_goal || "not recorded"}\nOutcome: ${session.outcome || "not recorded"}\nWent well: ${session.what_went_well || "not recorded"}\nChallenges: ${session.challenges || "not recorded"}\nRecovery: ${session.recovery_notes || "not recorded"}\nHomework: ${session.homework || "not recorded"}`).join("\n\n")
      : "No completed internal sessions yet.";
    const noteContext = notes.length ? notes.map((note) => `${note.created_at}: ${note.note}`).join("\n") : "No recent trainer notes.";
    const nextNumber = (completedSessions[0]?.session_number ?? 0) + 1;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [{
        role: "system",
        content: `You are preparing a concise internal Patriot K9 Command training session. Use doctrine internally, but do not dump protocols. Prioritize calm engagement, clarity, structured communication, foundations before advanced work, environmental neutrality, recovery, progressive proofing, stability over speed, and real-world function. Do not diagnose or promise outcomes. Return valid JSON with exactly: title, objectives, training_plan, trainer_focus, progression_goal. objectives must be 2-4 concise lines. training_plan must be a short numbered plan with durations. Use previous completed-session evidence to repeat, regress, or progress responsibly.\n\nRELEVANT DOCTRINE\n${buildPatriotK9DoctrinePrompt()}\n\nDOG\n${buildDogCaseFileContext(profile)}\nRecord type: ${dog.record_type}\n\nRECENT TRAINER NOTES\n${noteContext}\n\nCOMPLETED SESSION HISTORY\n${history}`,
      }],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let generated: Record<string, unknown>;
    try { generated = JSON.parse(raw) as Record<string, unknown>; } catch { return NextResponse.json({ error: "The AI returned an unreadable session draft." }, { status: 500 }); }
    const value = (key: string) => typeof generated[key] === "string" ? generated[key].trim() : "";

    return NextResponse.json({
      draft: {
        session_number: nextNumber,
        title: value("title") || `Session ${nextNumber}`,
        objectives: value("objectives"),
        training_plan: value("training_plan"),
        trainer_focus: value("trainer_focus"),
        progression_goal: value("progression_goal"),
      },
      generatedBy: userId,
    });
  } catch (error) {
    console.error("Admin next session generation error:", error);
    return NextResponse.json({ error: "Unable to generate the next training session." }, { status: 500 });
  }
}
