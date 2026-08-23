import { NextRequest, NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdminWorkspace } from "@/lib/admin";
import type { AdminDogProfile } from "@/lib/adminDogs";
import { hydrateDogCaseFile, serializeDogCaseFile } from "@/lib/dogCaseFile";
import { getAvailableMainGoals, normalizeGoalType } from "@/lib/dogGoals";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DOG_PROFILE_IMAGES_BUCKET = "dog-profile-images";
const internalRecordTypes = ["personal", "client", "breeding"];
const adminDogColumns =
  "id, name, goal_type, main_goal, reward_type, skill_level, custom_notes, profile_image_path, record_type, client_owner_name, client_owner_email, client_owner_phone, created_at, updated_at";

const isMissingOptionalSchemaError = (error: { code?: string }) =>
  error.code === "PGRST205" || error.code === "PGRST204";

const getAuthorizationResponse = (error: unknown) => {
  if (error instanceof AdminAuthorizationError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }

  return null;
};

const deleteRelatedRecords = async (dogId: string) => {
  const operations = [
    {
      label: "coaching history",
      run: () =>
        supabaseAdmin
          .from("dog_chats")
          .delete()
          .eq("dog_profile_id", dogId),
    },
    {
      label: "generated training plans",
      run: () =>
        supabaseAdmin
          .from("dog_outputs")
          .delete()
          .eq("dog_profile_id", dogId),
    },
    {
      label: "training timeline",
      optionalUntilTimelineMigrationIsApplied: true,
      run: () =>
        supabaseAdmin
          .from("dog_timeline_events")
          .delete()
          .eq("dog_id", dogId),
    },
    {
      label: "training phase",
      optionalUntilTimelineMigrationIsApplied: true,
      run: () => supabaseAdmin.from("dog_training_phase").delete().eq("dog_id", dogId),
    },
    {
      label: "internal trainer notes",
      optionalUntilTimelineMigrationIsApplied: true,
      run: () => supabaseAdmin.from("admin_dog_notes").delete().eq("dog_id", dogId),
    },
    {
      label: "client evaluations",
      optionalUntilTimelineMigrationIsApplied: true,
      run: () => supabaseAdmin.from("admin_dog_evaluations").delete().eq("dog_id", dogId),
    },
    {
      label: "linked session logs",
      optionalUntilTimelineMigrationIsApplied: true,
      run: () => supabaseAdmin.from("session_logs").delete().eq("dog_profile_id", dogId),
    },
  ];

  for (const operation of operations) {
    const { error } = await operation.run();
    if (error) {
      if (operation.label === "training timeline") {
        console.error("Admin dog timeline cleanup failed", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
      }

      if (operation.optionalUntilTimelineMigrationIsApplied && isMissingOptionalSchemaError(error)) {
        console.warn(
          `Skipping ${operation.label} cleanup because its optional table or column is not present. Apply the related Supabase migration.`,
        );
        continue;
      }

      console.error(`Admin dog ${operation.label} cleanup error:`, error);
      return `Unable to remove related ${operation.label}.`;
    }
  }

  return null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

const withSignedImageUrl = async (profile: AdminDogProfile) => {
  if (!profile.profile_image_path) return { ...profile, profile_image_url: null };

  const { data, error } = await supabaseAdmin.storage
    .from(DOG_PROFILE_IMAGES_BUCKET)
    .createSignedUrl(profile.profile_image_path, 60 * 60);

  if (error) {
    console.error("Admin case file photo signing error:", error);
    return { ...profile, profile_image_url: null };
  }

  return { ...profile, profile_image_url: data.signedUrl };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminWorkspace();
    const { id } = await params;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("dog_profiles")
      .select(adminDogColumns)
      .eq("id", id)
      .in("record_type", internalRecordTypes)
      .maybeSingle();

    if (profileError) {
      console.error("Admin case file profile load error:", profileError);
      return NextResponse.json({ error: "Unable to load the internal dog record." }, { status: 500 });
    }
    if (!profile) return NextResponse.json({ error: "Internal dog record not found." }, { status: 404 });

    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from("session_logs")
      .select("id, session_date, duration, focus, wins, issues, goal_type, main_goal, created_at")
      .eq("dog_profile_id", id)
      .order("created_at", { ascending: false });

    const sessionHistoryAvailable = !sessionError;
    if (sessionError && sessionError.code !== "PGRST205" && sessionError.code !== "42703") {
      console.error("Admin case file session history error:", sessionError);
      return NextResponse.json({ error: "Unable to load training history." }, { status: 500 });
    }

    const { data: adminSessions, error: adminSessionsError } = await supabaseAdmin
      .from("admin_training_sessions")
      .select("*")
      .eq("dog_id", id)
      .order("created_at", { ascending: false });

    if (adminSessionsError && adminSessionsError.code !== "PGRST205") {
      console.error("Admin case file internal session error:", adminSessionsError);
      return NextResponse.json({ error: "Unable to load internal training sessions." }, { status: 500 });
    }

    return NextResponse.json({
      profile: await withSignedImageUrl(profile as AdminDogProfile),
      sessions: sessions ?? [],
      sessionHistoryAvailable,
      adminSessions: adminSessions ?? [],
    });
  } catch (error) {
    const authorizationResponse = getAuthorizationResponse(error);
    if (authorizationResponse) return authorizationResponse;

    console.error("GET /api/admin/dogs/[id] crashed:", error);
    return NextResponse.json({ error: "Unable to load the internal dog record." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminWorkspace();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("dog_profiles")
      .select(adminDogColumns)
      .eq("id", id)
      .in("record_type", internalRecordTypes)
      .maybeSingle();

    if (profileError) {
      console.error("Admin dog profile update lookup error:", profileError);
      return NextResponse.json({ error: "Unable to load the internal dog record." }, { status: 500 });
    }
    if (!profile) return NextResponse.json({ error: "Internal dog record not found." }, { status: 404 });

    const text = (key: string, maxLength: number, required = false) => {
      const value = body[key];
      if (typeof value !== "string") return null;
      const trimmed = value.trim();
      if (required && !trimmed) return null;
      return trimmed.slice(0, maxLength);
    };
    const name = text("name", 120, true);
    const breed = text("breed", 120);
    const age = text("age", 80);
    const goalTypeInput = text("goalType", 80, true);
    const mainGoal = text("mainGoal", 160, true);
    const sex = body.sex;

    if (!name || breed === null || age === null || !goalTypeInput || !mainGoal) {
      return NextResponse.json({ error: "Name, breed, age, training category, and training focus must be valid text." }, { status: 400 });
    }

    const goalType = normalizeGoalType(goalTypeInput);
    if (goalType !== goalTypeInput) {
      return NextResponse.json({ error: "Choose a valid training category." }, { status: 400 });
    }
    const caseFile = hydrateDogCaseFile(profile);
    if (!getAvailableMainGoals(goalType, caseFile.mainGoal).includes(mainGoal)) {
      return NextResponse.json({ error: "Choose a valid training focus for the selected category." }, { status: 400 });
    }
    if (profile.record_type === "breeding" && sex !== "Male" && sex !== "Female") {
      return NextResponse.json({ error: "Choose Male or Female for a breeding dog." }, { status: 400 });
    }
    const breedingSex = sex === "Male" || sex === "Female" ? sex : null;

    const updatedCaseFile = {
      ...caseFile,
      name,
      breed,
      age,
      sex: profile.record_type === "breeding" && breedingSex ? breedingSex : caseFile.sex,
      goalType,
      mainGoal,
      selectedGoals: [mainGoal],
    };
    const { data, error } = await supabaseAdmin
      .from("dog_profiles")
      .update({
        name,
        goal_type: goalType,
        main_goal: mainGoal,
        custom_notes: serializeDogCaseFile(updatedCaseFile),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("record_type", profile.record_type)
      .select(adminDogColumns)
      .maybeSingle();

    if (error || !data) {
      console.error("Admin dog profile update error:", error);
      return NextResponse.json({ error: "Unable to update the internal dog profile." }, { status: 500 });
    }

    return NextResponse.json({ profile: await withSignedImageUrl(data as AdminDogProfile) });
  } catch (error) {
    const authorizationResponse = getAuthorizationResponse(error);
    if (authorizationResponse) return authorizationResponse;

    console.error("PATCH /api/admin/dogs/[id] crashed:", error);
    return NextResponse.json({ error: "Unable to update the internal dog profile." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminWorkspace();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Dog record id is required." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("dog_profiles")
      .select("id, profile_image_path")
      .eq("id", id)
      .in("record_type", internalRecordTypes)
      .maybeSingle();

    if (profileError) {
      console.error("Admin dog profile lookup error:", profileError);
      return NextResponse.json({ success: false, error: "Unable to verify the internal dog record." }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ success: false, error: "Internal dog record not found." }, { status: 404 });
    }

    // These records carry a dog id, unlike session_logs which only retain a dog name.
    // Deleting sessions by name could remove another dog's history, so they are retained.
    const relatedRecordError = await deleteRelatedRecords(id);
    if (relatedRecordError) {
      return NextResponse.json({ success: false, error: relatedRecordError }, { status: 500 });
    }

    const { data: deletedProfile, error: deleteError } = await supabaseAdmin
      .from("dog_profiles")
      .delete()
      .eq("id", id)
      .in("record_type", internalRecordTypes)
      .select("id")
      .maybeSingle();

    if (deleteError || !deletedProfile) {
      console.error("Admin dog profile deletion error:", deleteError);
      return NextResponse.json({ success: false, error: "Unable to delete the internal dog record." }, { status: 500 });
    }

    let photoCleanupFailed = false;
    if (profile.profile_image_path) {
      const { error: photoCleanupError } = await supabaseAdmin.storage
        .from(DOG_PROFILE_IMAGES_BUCKET)
        .remove([profile.profile_image_path]);

      if (photoCleanupError) {
        photoCleanupFailed = true;
        console.error("Admin dog photo cleanup failed:", photoCleanupError);
      }
    }

    return NextResponse.json({ success: true, photoCleanupFailed });
  } catch (error) {
    const authorizationResponse = getAuthorizationResponse(error);
    if (authorizationResponse) return authorizationResponse;

    console.error("DELETE /api/admin/dogs/[id] crashed:", error);
    return NextResponse.json({ success: false, error: "Unable to delete the internal dog record." }, { status: 500 });
  }
}
