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