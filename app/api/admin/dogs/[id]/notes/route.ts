import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

const internalRecordTypes = ["personal", "client", "breeding"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

const authorizationResponse = (error: unknown) =>
  error instanceof AdminAuthorizationError
    ? NextResponse.json({ error: error.message }, { status: error.status })
    : null;

const getInternalDog = async (dogId: string) => {
  const { data, error } = await supabaseAdmin
    .from("dog_profiles")
    .select("id")
    .eq("id", dogId)
    .in("record_type", internalRecordTypes)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

const getCreatorNames = async (creatorIds: string[]) => {
  const client = await clerkClient();
  const uniqueIds = [...new Set(creatorIds)];
  const names = new Map<string, string>();

  await Promise.all(
    uniqueIds.map(async (creatorId) => {
      try {
        const user = await client.users.getUser(creatorId);
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
        if (name) names.set(creatorId, name);
      } catch {
        // A removed Clerk user does not make internal notes unavailable.
      }
    }),
  );

  return names;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!(await getInternalDog(id))) return NextResponse.json({ error: "Internal dog record not found." }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from("admin_dog_notes")
      .select("id, dog_id, created_by_clerk_user_id, note, created_at, updated_at")
      .eq("dog_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin dog notes load error:", error);
      return NextResponse.json({ error: "Unable to load internal notes." }, { status: 500 });
    }

    const creatorNames = await getCreatorNames((data ?? []).map((note) => note.created_by_clerk_user_id));
    return NextResponse.json({
      notes: (data ?? []).map((note) => ({
        ...note,
        creatorName: creatorNames.get(note.created_by_clerk_user_id) ?? "Patriot K9 Admin",
      })),
    });
  } catch (error) {
    const response = authorizationResponse(error);
    if (response) return response;
    console.error("GET /api/admin/dogs/[id]/notes crashed:", error);
    return NextResponse.json({ error: "Unable to load internal notes." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const userId = await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as { note?: string };
    const note = body.note?.trim();

    if (!note) return NextResponse.json({ error: "A note is required." }, { status: 400 });
    if (!(await getInternalDog(id))) return NextResponse.json({ error: "Internal dog record not found." }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from("admin_dog_notes")
      .insert({ dog_id: id, created_by_clerk_user_id: userId, note })
      .select("id, dog_id, created_by_clerk_user_id, note, created_at, updated_at")
      .single();

    if (error || !data) {
      console.error("Admin dog note creation error:", error);
      return NextResponse.json({ error: "Unable to save internal note." }, { status: 500 });
    }

    const creatorNames = await getCreatorNames([userId]);
    return NextResponse.json({ note: { ...data, creatorName: creatorNames.get(userId) ?? "Patriot K9 Admin" } });
  } catch (error) {
    const response = authorizationResponse(error);
    if (response) return response;
    console.error("POST /api/admin/dogs/[id]/notes crashed:", error);
    return NextResponse.json({ error: "Unable to save internal note." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    const noteId = request.nextUrl.searchParams.get("noteId");
    if (!noteId) return NextResponse.json({ error: "noteId is required." }, { status: 400 });
    if (!(await getInternalDog(id))) return NextResponse.json({ error: "Internal dog record not found." }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from("admin_dog_notes")
      .delete()
      .eq("id", noteId)
      .eq("dog_id", id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      console.error("Admin dog note deletion error:", error);
      return NextResponse.json({ error: "Unable to delete internal note." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const response = authorizationResponse(error);
    if (response) return response;
    console.error("DELETE /api/admin/dogs/[id]/notes crashed:", error);
    return NextResponse.json({ error: "Unable to delete internal note." }, { status: 500 });
  }
}
