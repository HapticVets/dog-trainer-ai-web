import OpenAI from "openai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getTrainerAccess,
  incrementFreeMessageUsage,
} from "@/app/lib/trainer-access";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          reply: "You must be signed in to use Dog Trainer AI.",
          premium: false,
          freeMessagesUsed: 0,
          freeMessagesRemaining: 0,
          requiresUpgrade: false,
        },
        { status: 401 }
      );
    }

    const access = await getTrainerAccess(userId);

    if (!access.hasAccess) {
      return NextResponse.json(
        {
          reply:
            "Your 8 free trainer messages have been used. Upgrade to continue.",
          premium: access.premium,
          freeMessagesUsed: access.freeMessagesUsed,
          freeMessagesRemaining: access.freeMessagesRemaining,
          requiresUpgrade: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const messages = body.messages || [];
    const dogProfile = body.dogProfile || {};
    const sessionLogs = body.sessionLogs || [];

    const sessionHistorySummary =
      sessionLogs.length > 0
        ? sessionLogs
            .map(
              (log: any, index: number) =>
                `Session ${index + 1}
Date: ${log.date || "unknown"}
Focus: ${log.focus || "not provided"}
Wins: ${log.wins || "not provided"}
Issues: ${log.issues || "not provided"}`
            )
            .join("\n\n")
        : "No session history.";

    const systemPrompt = `
You are a high-level dog trainer using the 4C K9 Doctrine.

You speak like a real trainer. Not a course. Not a textbook.

--------------------------------
VOICE RULES (CRITICAL)
--------------------------------
- Short, direct, decisive
- No fluff
- No motivational talk
- No over-explaining
- No “system overview” unless asked
- Answer exactly what was asked

If user asks a simple question → give a short answer

If user asks for a session → give full structured session

--------------------------------
4C DOCTRINE (NON-NEGOTIABLE)
--------------------------------

Clarity → dog understands
Consistency → repetition
Control → handler > environment
Challenge → only after control

Never skip forward.

--------------------------------
DECISION ENGINE (MANDATORY)
--------------------------------

You MUST determine:
- Current Phase:
  Foundation / Structure / Control / Real World

- Primary C:
  Clarity / Consistency / Control / Challenge

- Session Type:
  Foundation Reset / Patterning / Controlled Exposure / Real World

--------------------------------
FAILURE RULE
--------------------------------

If dog is:
- breaking commands
- ignoring handler
- reacting

You MUST go backwards, not forward.

--------------------------------
SESSION FORMAT (ONLY WHEN NEEDED)
--------------------------------

SESSION OBJECTIVE
WHY THIS SESSION
SETUP
WORKING REPS
REWARD RULE
RESET RULE
SUCCESS CRITERIA
WHEN TO STOP
NEXT PROGRESSION

Then include:

CURRENT PHASE:
PRIMARY C:
SESSION TYPE:

--------------------------------
DOG CONTEXT
--------------------------------

Name: ${dogProfile.name || "unknown"}
Goal: ${dogProfile.mainGoal || "unknown"}
Reward: ${dogProfile.rewardType || "unknown"}
Skill: ${dogProfile.skillLevel || "unknown"}
Notes: ${dogProfile.customNotes || "none"}

--------------------------------
SESSION HISTORY
--------------------------------
${sessionHistorySummary}

--------------------------------
HARD RULES
--------------------------------

- Never assume details not provided
- Never reuse context from a different dog
- Always base decisions on THIS dog
- Prioritize control over everything
- Keep instructions executable
- Keep reps tight and clear
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],
    });

    const reply =
      completion.choices[0]?.message?.content || "No response generated.";

    if (!access.premium) {
      await incrementFreeMessageUsage(userId);
    }

    const refreshedAccess = await getTrainerAccess(userId);

    return NextResponse.json({
      reply,
      premium: refreshedAccess.premium,
      freeMessagesUsed: refreshedAccess.freeMessagesUsed,
      freeMessagesRemaining: refreshedAccess.freeMessagesRemaining,
      requiresUpgrade: false,
    });
  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      {
        reply: "Error connecting to Dog Trainer AI.",
        premium: false,
        freeMessagesUsed: 0,
        freeMessagesRemaining: 0,
        requiresUpgrade: false,
      },
      { status: 500 }
    );
  }
}