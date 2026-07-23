import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getDogTrainingPhase,
  updateDogTrainingPhase,
  type DogTrainingPhaseUpdate,
} from "@/lib/dogTrainingPhase";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const dogId = request.nextUrl.searchParams.get("dog_profile_id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!dogId) return NextResponse.json({ error: "dog_profile_id is required" }, { status: 400 });

    return NextResponse.json({ phase: await getDogTrainingPhase(userId, dogId) });
  } catch (error) {
    console.error("Unable to load dog training phase:", error);
    return NextResponse.json({ error: "Unable to load training phase." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (typeof body.dogProfileId !== "string" || !body.dogProfileId) {
      return NextResponse.json({ error: "dogProfileId is required" }, { status: 400 });
    }

    const phaseUpdate =
      body.phase && typeof body.phase === "object" ? body.phase : {};
    const phase = await updateDogTrainingPhase(
      userId,
      body.dogProfileId,
      phaseUpdate as Partial<DogTrainingPhaseUpdate>,
    );
    return NextResponse.json({ phase });
  } catch (error) {
    console.error("Unable to update dog training phase:", error);
    return NextResponse.json({ error: "Unable to update training phase." }, { status: 500 });
  }
}
