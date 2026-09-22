import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { NextResponse } from "next/server";
import { getTrainerAccess } from "@/app/lib/trainer-access";
import { buildDogCaseFileContext, hydrateDogCaseFile } from "@/lib/dogCaseFile";
import { getOwnedCustomerDog } from "@/lib/customerDogProfiles";
import { supabaseAdmin } from "@/lib/supabase-admin";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_REQUEST_BYTES = 1_024;
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RateLimitEntry = { count: number; resetAt: number };

const progressRateLimits = new Map<string, RateLimitEntry>();

const takeRateLimit = (userId: string, now = Date.now()) => {
  if (progressRateLimits.size > 500) {
    for (const [key, entry] of progressRateLimits) {
      if (entry.resetAt <= now) progressRateLimits.delete(key);
    }
  }

  const current = progressRateLimits.get(userId);

  if (!current || current.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    progressRateLimits.set(userId, { count: 1, resetAt });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= RATE_LIMIT_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
};

const progressSystemPrompt = `
You are Dog Trainer AI, a serious professional dog trainer.

Generate a structured progress summary using exactly this format:

CURRENT STATE
PROGRESS MADE
RECURRING PROBLEMS
TRAINING PRIORITIES
NEXT SESSION PLAN

Rules:
- Be concise, direct, and specific.
- Use trainer-level language.
- Base every conclusion on the supplied profile and recorded sessions.
- Never invent progress or observations.
- If evidence is limited, state what is missing.
`;

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    console.warn("Progress generation rejected: unauthenticated request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const keys = Object.keys(body);
  const dogProfileId = (body as Record<string, unknown>).dogProfileId;
  if (
    keys.length !== 1 ||
    keys[0] !== "dogProfileId" ||
    typeof dogProfileId !== "string" ||
    !UUID_PATTERN.test(dogProfileId)
  ) {
    return NextResponse.json({ error: "A valid dogProfileId is required" }, { status: 400 });
  }

  try {
    const dog = await getOwnedCustomerDog(userId, dogProfileId);
    if (!dog) {
      return NextResponse.json({ error: "Dog profile not found" }, { status: 404 });
    }

    const access = await getTrainerAccess(userId);
    if (!access.hasFullTrainerAccess) {
      return NextResponse.json(
        {
          error: "Progress reports are available with Premium training access.",
          requiresUpgrade: true,
        },
        { status: 403 },
      );
    }

    const rateLimit = takeRateLimit(userId);
    if (!rateLimit.allowed) {
      console.warn("Progress generation rate limited for authenticated user");
      return NextResponse.json(
        { error: "Too many progress reports requested. Please try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const { data: sessionLogs, error: sessionError } = await supabaseAdmin
      .from("session_logs")
      .select("session_date, duration, focus, wins, issues, created_at")
      .eq("clerk_user_id", userId)
      .eq("dog_profile_id", dogProfileId)
      .order("session_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(10);

    if (sessionError) {
      console.error("Progress session lookup failed", { code: sessionError.code });
      return NextResponse.json({ error: "Unable to load training history" }, { status: 500 });
    }

    if (!sessionLogs?.length) {
      return NextResponse.json(
        { error: "Log at least one training session before generating a progress report." },
        { status: 400 },
      );
    }

    const dogProfile = hydrateDogCaseFile(dog);
    const sessionSummary = sessionLogs
      .map(
        (log, index) => `Session ${index + 1}
Date: ${log.session_date || log.created_at}
Duration: ${log.duration || "not provided"}
Focus: ${log.focus || "not provided"}
Wins: ${log.wins || "not provided"}
Issues: ${log.issues || "not provided"}`,
      )
      .join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.2,
      messages: [
        { role: "system", content: progressSystemPrompt },
        {
          role: "user",
          content: `${buildDogCaseFileContext(dogProfile)}\n\nSESSION LOGS:\n${sessionSummary}`,
        },
      ],
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      return NextResponse.json({ error: "No progress report was generated" }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Progress generation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Unable to generate a progress report right now" },
      { status: 502 },
    );
  }
}
