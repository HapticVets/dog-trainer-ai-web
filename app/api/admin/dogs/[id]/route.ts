import { NextRequest, NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdminWorkspace } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

const DOG_PROFILE_IMAGES_BUCKET = "dog-profile-images";
const internalRecordTypes = ["personal", "client", "breeding"];

const getAuthorizationResponse = (error: unknown) => {
  if (error instanceof AdminAuthorizationError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }

  return null;
};

const deleteRelatedRecords = async (ownerId: string, dogId: string) => {
  const operations = [
    {
      label: "coaching history",
      run: () =>
        supabaseAdmin
          .from("dog_chats")
          .delete()
          .eq("clerk_user_id", ownerId)
          .eq("dog_profile_id", dogId),
    },
    {
      label: "generated training plans",
      run: () =>
        supabaseAdmin
          .from("dog_outputs")
          .delete()
          .eq("clerk_user_id", ownerId)
          .eq("dog_profile_id", dogId),
    },
    {
      label: "training timeline",
      run: () =>
        supabaseAdmin
          .from("dog_timeline_events")
          .delete()
          .eq("clerk_user_id", ownerId)
          .eq("dog_id", dogId),
    },
    {
      label: "training phase",
      run: () => supabaseAdmin.from("dog_training_phase").delete().eq("dog_id", dogId),
    },
  ];

  for (const operation of operations) {
    const { error } = await operation.run();
    if (error) {
      console.error(`Admin dog ${operation.label} cleanup error:`, error);
      return `Unable to remove related ${operation.label}.`;
    }
  }

  return null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { ownerId } = await requireAdminWorkspace();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ success: false, error: "Dog record id is required." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("dog_profiles")
      .select("id, profile_image_path")
      .eq("id", id)
      .eq("clerk_user_id", ownerId)
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
    const relatedRecordError = await deleteRelatedRecords(ownerId, id);
    if (relatedRecordError) {
      return NextResponse.json({ success: false, error: relatedRecordError }, { status: 500 });
    }

    const { data: deletedProfile, error: deleteError } = await supabaseAdmin
      .from("dog_profiles")
      .delete()
      .eq("id", id)
      .eq("clerk_user_id", ownerId)
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
