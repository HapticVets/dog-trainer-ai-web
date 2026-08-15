import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getActiveClientHomeworkContext } from "@/lib/clientHomework";
import { getOwnedCustomerDog } from "@/lib/customerDogProfiles";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const dogId = request.nextUrl.searchParams.get("dog_profile_id");

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!dogId) return NextResponse.json({ error: "dog_profile_id is required" }, { status: 400 });

    if (!await getOwnedCustomerDog(userId, dogId)) {
      return NextResponse.json({ error: "Dog profile not found" }, { status: 404 });
    }

    const homework = await getActiveClientHomeworkContext(userId, dogId);
    return NextResponse.json({ homework });
  } catch (error) {
    console.error("Unable to load customer homework:", error);
    return NextResponse.json({ error: "Unable to load trainer homework." }, { status: 500 });
  }
}
