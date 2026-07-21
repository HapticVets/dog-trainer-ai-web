import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  backfillDogTimeline,
  getDogTimelineEvents,
  type DogTimelineFilter,
} from "@/lib/dogTimeline";

const filters = new Set<DogTimelineFilter>([
  "all",
  "sessions",
  "progress",
  "goals",
  "case-file",
]);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dogId = request.nextUrl.searchParams.get("dog_profile_id");
    if (!dogId) {
      return NextResponse.json({ error: "dog_profile_id is required" }, { status: 400 });
    }

    const requestedFilter = request.nextUrl.searchParams.get("filter") ?? "all";
    const filter = filters.has(requestedFilter as DogTimelineFilter)
      ? (requestedFilter as DogTimelineFilter)
      : "all";

    // Existing records are initialized lazily and idempotently on first timeline view.
    await backfillDogTimeline(userId, dogId);
    const timeline = await getDogTimelineEvents({
      userId,
      dogId,
      filter,
      cursor: request.nextUrl.searchParams.get("cursor"),
    });

    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Unable to load dog timeline:", error);
    return NextResponse.json({ error: "Unable to load training timeline." }, { status: 500 });
  }
}
