import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dogProfileId = request.nextUrl.searchParams.get("dog_profile_id");

  if (!dogProfileId) {
    return NextResponse.json({ error: "Missing dog_profile_id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("dog_outputs")
    .select("*")
    .eq("clerk_user_id", userId)
    .eq("dog_profile_id", dogProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ outputs: data ?? [] });
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.dogProfileId) {
    return NextResponse.json({ error: "dogProfileId is required" }, { status: 400 });
  }

  if (!body.outputType || !body.content) {
    return NextResponse.json({ error: "outputType and content are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("dog_outputs")
    .insert([
      {
        clerk_user_id: userId,
        dog_profile_id: body.dogProfileId,
        output_type: body.outputType,
        content: body.content,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ output: data });
}