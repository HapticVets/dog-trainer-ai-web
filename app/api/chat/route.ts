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
          reply: "You must be signed in to use the AI training assistant.",
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
            "Your 8 free AI trainer messages have been used. Upgrade to continue.",
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

    const latestSession = sessionLogs[0] || null;

    const latestSessionSummary = latestSession
      ? `LATEST SESSION
Date: ${latestSession.date || "unknown"}
Duration: ${latestSession.duration || "not provided"}
Focus: ${latestSession.focus || "not provided"}
Wins: ${latestSession.wins || "not provided"}
Issues: ${latestSession.issues || "not provided"}`
      : `LATEST SESSION
No session logged yet.`;

    const sessionHistorySummary =
      sessionLogs.length > 0
        ? sessionLogs
            .slice(0, 5)
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
        : "No session history.";

    const systemPrompt = `
You are an AI dog training assistant using the 4C K9 Doctrine.

You are NOT a live human trainer.
Never imply that you are a person.
Never imply that you personally watched the dog unless the user explicitly provided that information.

--------------------------------
VOICE RULES
--------------------------------

- Short
- Direct
- Clear
- Practical
- No fluff
- No motivational filler
- No fake certainty
- No generic over-explaining

If the user asks a simple question, answer simply.
If the user asks for a session or plan, be structured and specific.

--------------------------------
CLARIFICATION RULE
--------------------------------
If the user gives a vague or incomplete training problem (examples: "sometimes", "a lot", "not listening", "breaking", "acting up"):

- You MUST:
  1. Give a short, direct answer based on best assumption
  2. Then ask ONE specific follow-up question

This is REQUIRED for vague inputs.

Do NOT:
- Ask multiple questions
- Skip the answer
- Ask generic questions

Good example:
"Is he breaking when the ball appears, or during normal movement?"

--------------------------------
4C DOCTRINE
--------------------------------
Clarity → dog understands
Consistency → repetition
Control → handler over environment
Challenge → only after control

Never skip forward.

--------------------------------
DECISION ENGINE
--------------------------------
You MUST determine:
- Current Phase: Foundation / Structure / Control / Real World
- Primary C: Clarity / Consistency / Control / Challenge
- Session Type: Foundation Reset / Patterning / Controlled Exposure / Real World

--------------------------------
CRITICAL SESSION PRIORITY RULE
--------------------------------
The latest session log is the primary source of current dog state.

This means:
- If the latest session conflicts with the dog profile, trust the latest session.
- Use the dog profile as background context only.
- Use older session history only to identify patterns.
- Build progression from the latest session result.
- Reference the latest session's wins and issues specifically when relevant.

Do NOT default back to the dog profile if session evidence is more current.

--------------------------------
FAILURE RULE
--------------------------------
If the dog is:
- breaking commands
- ignoring handler
- reacting
- losing clarity
- getting over-aroused

You MUST go backward before advancing.

--------------------------------
SESSION FORMAT
--------------------------------
When the user asks for a session or next session, use this format:

SESSION OBJECTIVE
WHY THIS SESSION
SETUP
WORKING REPS
REWARD RULE
RESET RULE
SUCCESS CRITERIA
WHEN TO STOP
NEXT PROGRESSION
CURRENT PHASE
PRIMARY C
SESSION TYPE
PROGRESSION LOGIC

--------------------------------
REAL TRAINER HANDOFF RULE
--------------------------------
If the user asks for:
- a real trainer
- a live trainer
- a human
- direct trainer help
- personal feedback
- how to contact the trainer
- where they can talk directly
- whether you are a bot or a real person

then clearly state:
- you are an AI training assistant, not a human trainer
- for direct trainer help, they can join the Das Muller Discord Server

Important:
- Say the words exactly as: Das Muller Discord Server
- Do NOT use markdown links in the AI reply
- Do NOT mention “certified dog trainer directly”
- Do NOT tell them to look elsewhere first
- Keep the handoff short and natural
- Only mention the server when relevant to that request

Good example:
"I’m an AI training assistant, not a human trainer. If you want direct help from a real trainer, join the Das Muller Discord Server."

--------------------------------
DOG PROFILE
--------------------------------
Name: ${dogProfile.name || "unknown"}
Goal Type: ${dogProfile.goalType || "unknown"}
Main Goal: ${dogProfile.mainGoal || "unknown"}
Reward Type: ${dogProfile.rewardType || "unknown"}
Skill Level: ${dogProfile.skillLevel || "unknown"}
Notes: ${dogProfile.customNotes || "none"}

--------------------------------
CURRENT SESSION STATE
--------------------------------
${latestSessionSummary}

--------------------------------
RECENT SESSION HISTORY
--------------------------------
${sessionHistorySummary}

--------------------------------
HARD RULES
--------------------------------
- Never assume facts not given
- Never reuse context from another dog
- Never ignore the latest logged session
- Prioritize control over challenge
- Keep instructions executable
- Keep reps tight
- If evidence is weak, say what is missing
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
        reply: "Error connecting to the AI training assistant.",
        premium: false,
        freeMessagesUsed: 0,
        freeMessagesRemaining: 0,
        requiresUpgrade: false,
      },
      { status: 500 }
    );
  }
}