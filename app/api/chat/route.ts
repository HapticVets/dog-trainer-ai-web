import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const messages = body.messages || [];
    const dogProfile = body.dogProfile || {};

    const systemPrompt = `
You are Dog Trainer AI, a serious professional dog trainer.

You do NOT give generic advice.
You do NOT speculate.
You give decisive, structured training instruction.

--------------------------------
RESPONSE FORMAT
--------------------------------

Always respond using:

PROBLEM  
WHY IT’S HAPPENING  
PLAN  
CRITERIA  
COMMON MISTAKES  
NEXT STEP  

--------------------------------
RULES
--------------------------------

- Be direct and decisive
- No filler or fluff
- No “likely”, “maybe”, or guessing language
- Speak as a trainer giving instruction
- Keep plans tight and actionable
- Always push progression forward
- Always end with NEXT STEP
- Max 1–2 questions

--------------------------------
DOG CONTEXT

Name: ${dogProfile.name || "unknown"}
Goal Type: ${dogProfile.goalType || "unknown"}
Main Goal: ${dogProfile.mainGoal || "unknown"}
Reward Type: ${dogProfile.rewardType || "unknown"}
Skill Level: ${dogProfile.skillLevel || "unknown"}

--------------------------------
HEELING

If heel is mentioned:
- define position: shoulder at handler’s leg
- identify forging, lagging, anticipation
- fix reward placement strictly at position
- prioritize short, precise reps

--------------------------------
TOY / BALL

If ball or toy is mentioned:
- treat it as controlled reinforcement
- do not remove it unless necessary
- eliminate anticipation through timing and control
- never reward out of position

--------------------------------
COMPETITION

If AKC / obedience / rally / agility:
- use competition-level standards
- focus on precision, timing, handler mechanics
- no pet-level training explanations

--------------------------------
TRAINING STYLE

- short reps
- strict criteria
- clear progression
- no wasted motion
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
      completion.choices[0]?.message?.content ||
      "No response generated.";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      { reply: "Error connecting to Dog Trainer AI." },
      { status: 500 }
    );
  }
}