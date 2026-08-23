import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdminWorkspace } from "@/lib/admin";
import { normalizeBreedingDogSex } from "@/lib/breedingDogs";
import {
  buildAdminDogPayload,
  isDogRecordType,
  type AdminDogProfile,
  type CreateAdminDogInput,
} from "@/lib/adminDogs";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DOG_PROFILE_IMAGES_BUCKET = "dog-profile-images";
const adminDogColumns =
  "id, name, goal_type, main_goal, reward_type, skill_level, custom_notes, profile_image_path, record_type, client_owner_name, client_owner_email, client_owner_phone, created_at, updated_at";

type SupabaseErrorDetails = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

const unauthorizedResponse = (error: unknown) => {
  if (error instanceof AdminAuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return null;
};

const getAdminDogCreationErrorMessage = (
  error: SupabaseErrorDetails | null,
  recordType: string,
) => {
  if (error?.code === "PGRST204" || error?.code === "PGRST205" || error?.code === "42703") {
    return "Admin dog schema is not up to date.";
  }

  if (error?.code === "23502") {
    return "Required database field is missing.";
  }

  if (error?.code === "23505") {
    return "An internal dog record with these details already exists.";
  }

  if (recordType === "client") {
    return "Client dog record could not be saved.";
  }

  return "Unable to create internal dog record.";
};

const withSignedImageUrl = async (profile: AdminDogProfile) => {
  if (!profile.profile_image_path) {
    return { ...profile, profile_image_url: null };
  }

  const { data, error } = await supabaseAdmin.storage
    .from(DOG_PROFILE_IMAGES_BUCKET)
    .createSignedUrl(profile.profile_image_path, 60 * 60);

  if (error) {
    console.error("Admin dog photo signing error:", error);
    return { ...profile, profile_image_url: null };
  }

  return { ...profile, profile_image_url: data.signedUrl };
};

export async function GET() {
  try {
    await requireAdminWorkspace();
    const { data, error } = await supabaseAdmin
      .from("dog_profiles")
      .select(adminDogColumns)
      .in("record_type", ["personal", "client", "breeding"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin dog profile load error:", error);
      return NextResponse.json({ error: "Unable to load internal dog records." }, { status: 500 });
    }

    const profiles = await Promise.all(
      ((data ?? []) as AdminDogProfile[]).map(withSignedImageUrl),
    );

    return NextResponse.json({ profiles });
  } catch (error) {
    const authorizationResponse = unauthorizedResponse(error);
    if (authorizationResponse) return authorizationResponse;

    console.error("GET /api/admin/dogs crashed:", error);
    return NextResponse.json({ error: "Unable to load internal dog records." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { ownerId } = await requireAdminWorkspace();
    const body = (await request.json()) as Partial<CreateAdminDogInput>;

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Dog name is required." }, { status: 400 });
    }

    if (!isDogRecordType(body.recordType)) {
      return NextResponse.json({ error: "Choose a valid dog record type." }, { status: 400 });
    }

    const normalizedSex = normalizeBreedingDogSex(typeof body.sex === "string" ? body.sex : null);
    if (body.recordType === "breeding" && !normalizedSex) {
      return NextResponse.json({ error: "Choose Male or Female for a breeding dog." }, { status: 400 });
    }

    const payload = buildAdminDogPayload(ownerId, {
      name: body.name,
      breed: body.breed,
      age: body.age,
      sex: normalizedSex === "male" ? "Male" : normalizedSex === "female" ? "Female" : undefined,
      goalType: body.goalType,
      mainGoal: body.mainGoal,
      recordType: body.recordType,
      clientOwnerName: body.clientOwnerName,
      clientOwnerEmail: body.clientOwnerEmail,
      clientOwnerPhone: body.clientOwnerPhone,
    });

    const { data, error } = await supabaseAdmin
      .from("dog_profiles")
      .insert(payload)
      .select(adminDogColumns)
      .single();

    if (error || !data) {
      if (error) {
        console.error("Admin dog creation failed", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
      } else {
        console.error("Admin dog creation failed", {
          message: "Supabase insert returned no row and no error.",
        });
      }

      console.info("Admin dog creation payload shape", {
        recordType: payload.record_type,
        hasName: Boolean(payload.name),
        goalType: payload.goal_type,
        hasTrainingFocus: Boolean(payload.main_goal),
        hasClientOwnerName: Boolean(payload.client_owner_name),
        hasClientOwnerEmail: Boolean(payload.client_owner_email),
        hasClientOwnerPhone: Boolean(payload.client_owner_phone),
        hasCaseFilePayload: Boolean(payload.custom_notes),
      });

      return NextResponse.json(
        { error: getAdminDogCreationErrorMessage(error, payload.record_type) },
        { status: 500 },
      );
    }

    return NextResponse.json({ profile: await withSignedImageUrl(data as AdminDogProfile) });
  } catch (error) {
    const authorizationResponse = unauthorizedResponse(error);
    if (authorizationResponse) return authorizationResponse;

    console.error("POST /api/admin/dogs crashed:", error);
    return NextResponse.json({ error: "Unable to create internal dog record." }, { status: 500 });
  }
}
