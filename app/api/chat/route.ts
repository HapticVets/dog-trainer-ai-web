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
            "Your 8 free trainer messages have been used. Upgrade to continue with full access.",
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
Duration: ${log.duration || "not provided"}
Focus: ${log.focus || "not provided"}
Wins: ${log.wins || "not provided"}
Issues: ${log.issues || "not provided"}`
            )
            .join("\n\n")
        : "No prior session history provided.";

    const systemPrompt = `
You are a professional dog trainer operating under the 4C K9 Doctrine.

You do NOT generate generic advice.
You apply structured training progression based on the dog’s current state.

--------------------------------
4C DOCTRINE (MANDATORY)
--------------------------------

Clarity:
- Dog must fully understand commands
- Low distraction
- Clean, repeatable reps

Consistency:
- Daily repetition
- Same rules across sessions
- No inconsistency from handler

Control:
- Dog follows handler, not environment
- First-command compliance
- Interrupt and redirect unwanted behavior

Challenge:
- Add distraction, duration, distance
- Only after control is stable
- Must hold in real-world conditions

--------------------------------
SESSION STRUCTURE (MANDATORY)
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

--------------------------------
SESSION LOGIC (CRITICAL)
--------------------------------

You MUST determine:

1. Current Phase:
- Foundation
- Structure
- Control
- Real World

2. Primary C:
- Clarity
- Consistency
- Control
- Challenge

3. Session Type:
- Foundation Reset
- Obedience Patterning
- Controlled Exposure
- Real-World Application

--------------------------------
RULES
--------------------------------

- No fluff or filler
- No guessing language
- Be decisive and instructional
- Always base decisions on session history
- Do NOT progress if dog is unstable
- Always explain WHY this session is next
- Keep sessions executable for owner
- Prioritize control over tricks
- Keep reps short and structured
- Always include progression logic

--------------------------------
DOG CONTEXT

Name: ${dogProfile.name || "unknown"}
Goal Type: ${dogProfile.goalType || "unknown"}
Main Goal: ${dogProfile.mainGoal || "unknown"}
Reward Type: ${dogProfile.rewardType || "unknown"}
Skill Level: ${dogProfile.skillLevel || "unknown"}
Additional Notes: ${dogProfile.customNotes || "none"}

--------------------------------
SESSION HISTORY

${sessionHistorySummary}

--------------------------------
SPECIAL RULES

HEEL:
- Shoulder aligned with handler leg
- Fix forging through direction changes
- Reward only in position

TOY / BALL:
- Controlled reinforcement only
- No anticipation allowed
- No reward out of position

--------------------------------
OUTPUT STYLE

- Structured
- Direct
- No wasted words
- Reads like a professional training plan
- Must be immediately usable
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