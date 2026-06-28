import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const dogProfile = body.dogProfile || {};
    const sessionLogs = body.sessionLogs || [];

    const formattedLogs = Array.isArray(sessionLogs)
      ? sessionLogs
          .map((log: string, index: number) => `Session ${index + 1}: ${log}`)
          .join("\n")
      : "";

    const systemPrompt = `
You are Dog Trainer AI, a serious professional dog trainer.

You are generating a structured progress summary.

Respond using this format exactly:

PROGRESS SUMMARY
CURRENT FOCUS
WHAT IMPROVED
WHAT IS STILL BREAKING
CURRENT PLAN
NEXT COACHING STEP
REPORT BACK

Rules:
- Be concise
- Be direct
- Use trainer language
- Do not be generic
- If no progress exists, say so clearly
- If competition work is involved, use competition-level language
`;

    const userPrompt = `
DOG PROFILE
Name: ${dogProfile.name || "unknown"}
Goal Type: ${dogProfile.goalType || "unknown"}
Main Goal: ${dogProfile.mainGoal || "unknown"}
Reward Type: ${dogProfile.rewardType || "unknown"}
Skill Level: ${dogProfile.skillLevel || "unknown"}

SESSION LOGS
${formattedLogs || "No session logs yet."}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content || "No progress summary generated.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("PROGRESS_API_ERROR:", error);

    return NextResponse.json(
      { reply: "Error generating progress summary." },
      { status: 500 }
    );
  }
}