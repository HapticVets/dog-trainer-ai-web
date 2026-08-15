import OpenAI from "openai";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildDogCaseFileContext, hydrateDogCaseFile } from "@/lib/dogCaseFile";
import { buildPatriotK9DoctrinePrompt } from "@/lib/patriotK9Protocols";
import { supabaseAdmin } from "@/lib/supabase-admin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const internalRecordTypes = ["personal", "client", "breeding"];

type RouteContext = { params: Promise<{ id: string }> };

type GeneratedSession = {
  title: string;
  objectives: string;
  training_plan: string;
  trainer_focus: string;
  progression_goal: string;
};

const sessionResponseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "admin_training_session",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "objectives", "training_plan", "trainer_focus", "progression_goal"],
      properties: {
        title: { type: "string", minLength: 1 },
        objectives: {
          type: "array",
          minItems: 2,
          items: { type: "string", minLength: 1 },
        },
        training_plan: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["step", "activity", "duration", "details"],
            properties: {
              step: { type: "integer", minimum: 1 },
              activity: { type: "string", minLength: 1 },
              duration: { type: "string", minLength: 1 },
              details: { type: "string", minLength: 1 },
            },
          },
        },
        trainer_focus: { type: "string", minLength: 1 },
        progression_goal: { type: "string", minLength: 1 },
      },
    },
  },
};

const asText = (value: unknown) => typeof value === "string" ? value.trim() : "";

const asObjectives = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";

  return value
    .map(asText)
    .filter(Boolean)
    .map((objective) => `• ${objective}`)
    .join("\n");
};

const asTrainingPlan = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return "";

      const step = typeof item.step === "number" ? item.step : index + 1;
      const activity = asText(item.activity);
      const duration = asText(item.duration);
      const details = asText(item.details);
      if (!activity || !details) return "";

      return `${step}. ${activity}${duration ? ` — ${duration}` : ""}\n   ${details}`;
    })
    .filter(Boolean)
    .join("\n\n");
};

const normalizeGeneratedSession = (value: Record<string, unknown>): GeneratedSession | null => {
  const session = {
    title: asText(value.title),
    objectives: asObjectives(value.objectives),
    training_plan: asTrainingPlan(value.training_plan ?? value.trainingPlan),
    trainer_focus: asText(value.trainer_focus ?? value.trainerFocus),
    progression_goal: asText(value.progression_goal ?? value.progressionGoal),
  };

  const missingFields = Object.entries(session)
    .filter(([, fieldValue]) => !fieldValue)
    .map(([field]) => field);

  if (missingFields.length > 0) {
    console.error("Admin session generation returned incomplete content", {
      missingFields,
      responseFormat: "JSON object",
      fieldTypes: Object.fromEntries(
        ["title", "objectives", "training_plan", "trainer_focus", "progression_goal"].map((field) => [
          field,
          Array.isArray(value[field]) ? "array" : typeof value[field],
        ]),
      ),
    });
    return null;
  }

  return session;
};

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
      response_format: sessionResponseFormat,
      messages: [{
        role: "system",
        content: `You are preparing a concise internal Patriot K9 Command training session. Use doctrine internally, but do not dump protocols. Prioritize calm engagement, clarity, structured communication, foundations before advanced work, environmental neutrality, recovery, progressive proofing, stability over speed, and real-world function. Do not diagnose or promise outcomes. Use the supplied schema exactly. Objectives must be 2-4 practical trainer-facing items. Each training-plan step must include an activity, duration, and concrete trainer details. Use previous completed-session evidence to repeat, regress, or progress responsibly.\n\nRELEVANT DOCTRINE\n${buildPatriotK9DoctrinePrompt()}\n\nDOG\n${buildDogCaseFileContext(profile)}\nRecord type: ${dog.record_type}\n\nRECENT TRAINER NOTES\n${noteContext}\n\nCOMPLETED SESSION HISTORY\n${history}`,
      }],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let generated: Record<string, unknown>;
    try {
      generated = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      console.error("Admin session generation parsing failed", {
        responseFormat: "non-JSON or invalid JSON",
        responseLength: raw.length,
      });
      return NextResponse.json({ error: "Unable to generate a complete session. Please try again." }, { status: 500 });
    }

    const session = normalizeGeneratedSession(generated);
    if (!session) {
      return NextResponse.json({ error: "Unable to generate a complete session. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      draft: {
        session_number: nextNumber,
        ...session,
      },
      generatedBy: userId,
    });
  } catch (error) {
    console.error("Admin next session generation error:", error);
    return NextResponse.json({ error: "Unable to generate the next training session." }, { status: 500 });
  }
}
