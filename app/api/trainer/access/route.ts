import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getTrainerAccess } from "@/app/lib/trainer-access";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      {
        loggedIn: false,
        premium: false,
        freeMessagesUsed: 0,
        freeMessagesRemaining: 0,
        aiChatMessagesUsed: 0,
        aiChatMessagesRemaining: 0,
        firstSessionsGenerated: 0,
        sessionLogsUsed: 0,
        nextSessionsGenerated: 0,
        canCreateCaseFile: true,
        canGenerateFirstSession: true,
        canLogSession: true,
        canUseAiChat: false,
        canGenerateNextSession: false,
        hasAccess: false,
      },
      { status: 401 }
    );
  }

  const access = await getTrainerAccess(userId);

  return NextResponse.json({
    loggedIn: true,
    ...access,
  });
}
