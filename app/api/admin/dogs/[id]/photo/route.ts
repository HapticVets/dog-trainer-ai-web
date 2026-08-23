import { NextRequest, NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdminWorkspace } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "dog-profile-images";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const internalRecordTypes = ["personal", "client", "breeding"];
const acceptedFiles = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type AcceptedMimeType = keyof typeof acceptedFiles;
type RouteContext = { params: Promise<{ id: string }> };

const isAcceptedMimeType = (value: string): value is AcceptedMimeType =>
  value in acceptedFiles;

const isValidImageSignature = (buffer: Buffer, mimeType: AcceptedMimeType) => {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
};

const authorizationResponse = (error: unknown) =>
  error instanceof AdminAuthorizationError
    ? NextResponse.json({ error: error.message }, { status: error.status })
    : null;

const signedUrl = async (path: string) => {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { ownerId } = await requireAdminWorkspace();
    const { id } = await params;
    const formData = await request.formData();
    const dogProfileId = formData.get("dogProfileId");
    const image = formData.get("image");

    if (dogProfileId !== id || !id) {
      return NextResponse.json({ error: "Dog profile not found" }, { status: 404 });
    }
    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Choose a JPEG, PNG, or WebP image." }, { status: 400 });
    }

    const extension = image.name.split(".").pop()?.toLowerCase();
    if (!isAcceptedMimeType(image.type) || extension !== acceptedFiles[image.type] || image.size === 0) {
      return NextResponse.json({ error: "Only valid JPEG, PNG, or WebP images are supported." }, { status: 400 });
    }
    if (image.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Dog photos must be 5 MB or smaller." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("dog_profiles")
      .select("id, profile_image_path")
      .eq("id", id)
      .in("record_type", internalRecordTypes)
      .maybeSingle();

    if (profileError) {
      console.error("Admin dog photo lookup failed:", profileError);
      return NextResponse.json({ error: "Unable to load dog profile." }, { status: 500 });
    }
    if (!profile) return NextResponse.json({ error: "Dog profile not found" }, { status: 404 });

    const buffer = Buffer.from(await image.arrayBuffer());
    if (!isValidImageSignature(buffer, image.type)) {
      return NextResponse.json({ error: "The selected image file appears to be malformed." }, { status: 400 });
    }

    const path = `${ownerId}/${id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
      contentType: image.type,
      upsert: false,
    });
    if (uploadError) {
      console.error("Admin dog photo upload failed:", uploadError);
      return NextResponse.json({ error: "Unable to upload dog photo." }, { status: 500 });
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("dog_profiles")
      .update({ profile_image_path: path, updated_at: new Date().toISOString() })
      .eq("id", id)
      .in("record_type", internalRecordTypes)
      .select("profile_image_path")
      .maybeSingle();

    if (updateError || !updatedProfile?.profile_image_path) {
      await supabaseAdmin.storage.from(BUCKET).remove([path]);
      console.error("Admin dog photo database update failed:", updateError ?? "No internal dog profile was updated.");
      return NextResponse.json({ error: "Unable to save dog photo." }, { status: 500 });
    }

    if (profile.profile_image_path) {
      const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([profile.profile_image_path]);
      if (removeError) console.error("Previous admin dog photo cleanup failed:", removeError);
    }

    return NextResponse.json({
      profileImagePath: updatedProfile.profile_image_path,
      profileImageUrl: await signedUrl(updatedProfile.profile_image_path),
    });
  } catch (error) {
    const authorization = authorizationResponse(error);
    if (authorization) return authorization;

    console.error("Admin dog photo upload crashed:", error);
    return NextResponse.json({ error: "Unable to upload dog photo." }, { status: 500 });
  }
}
