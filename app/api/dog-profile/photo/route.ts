import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const BUCKET = "dog-profile-images";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const acceptedFiles = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

type AcceptedMimeType = keyof typeof acceptedFiles;

const isAcceptedMimeType = (value: string): value is AcceptedMimeType =>
  value in acceptedFiles;

const isValidImageSignature = (buffer: Buffer, mimeType: AcceptedMimeType) => {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    );
  }

  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  );
};

const getOwnedProfile = async (userId: string, dogProfileId: string) => {
  const { data, error } = await supabaseAdmin
    .from("dog_profiles")
    .select("id, profile_image_path")
    .eq("id", dogProfileId)
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

const createSignedImageUrl = async (path: string) => {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) throw new Error(error.message);
  return data.signedUrl;
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const dogProfileId = request.nextUrl.searchParams.get("dogProfileId");

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!dogProfileId) {
      return NextResponse.json({ error: "dogProfileId is required" }, { status: 400 });
    }

    const profile = await getOwnedProfile(userId, dogProfileId);
    if (!profile) return NextResponse.json({ error: "Dog profile not found" }, { status: 404 });

    if (!profile.profile_image_path) {
      return NextResponse.json({ profileImagePath: null, profileImageUrl: null });
    }

    return NextResponse.json({
      profileImagePath: profile.profile_image_path,
      profileImageUrl: await createSignedImageUrl(profile.profile_image_path),
    });
  } catch (error) {
    console.error("Failed to create dog profile image URL:", error);
    return NextResponse.json({ error: "Unable to load dog photo" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const dogProfileId = formData.get("dogProfileId");
    const image = formData.get("image");

    if (typeof dogProfileId !== "string" || !dogProfileId) {
      return NextResponse.json({ error: "dogProfileId is required" }, { status: 400 });
    }

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Choose a JPEG, PNG, or WebP image." }, { status: 400 });
    }

    const extension = image.name.split(".").pop()?.toLowerCase();
    if (
      !isAcceptedMimeType(image.type) ||
      extension !== acceptedFiles[image.type] ||
      image.size === 0
    ) {
      return NextResponse.json({ error: "Only valid JPEG, PNG, or WebP images are supported." }, { status: 400 });
    }

    if (image.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Dog photos must be 5 MB or smaller." }, { status: 400 });
    }

    const profile = await getOwnedProfile(userId, dogProfileId);
    if (!profile) return NextResponse.json({ error: "Dog profile not found" }, { status: 404 });

    const buffer = Buffer.from(await image.arrayBuffer());
    if (!isValidImageSignature(buffer, image.type)) {
      return NextResponse.json({ error: "The selected image file appears to be malformed." }, { status: 400 });
    }

    const path = `${userId}/${dogProfileId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
      contentType: image.type,
      upsert: false,
    });

    if (uploadError) {
      console.error("Dog photo upload failed:", uploadError);
      return NextResponse.json({ error: "Unable to upload dog photo." }, { status: 500 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("dog_profiles")
      .update({ profile_image_path: path, updated_at: new Date().toISOString() })
      .eq("id", dogProfileId)
      .eq("clerk_user_id", userId);

    if (updateError) {
      await supabaseAdmin.storage.from(BUCKET).remove([path]);
      console.error("Dog photo database update failed:", updateError);
      return NextResponse.json({ error: "Unable to save dog photo." }, { status: 500 });
    }

    if (profile.profile_image_path) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([profile.profile_image_path]);

      if (removeError) console.error("Previous dog photo cleanup failed:", removeError);
    }

    return NextResponse.json({
      profileImagePath: path,
      profileImageUrl: await createSignedImageUrl(path),
    });
  } catch (error) {
    console.error("Dog photo upload crashed:", error);
    return NextResponse.json({ error: "Unable to upload dog photo." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    const dogProfileId = request.nextUrl.searchParams.get("dogProfileId");

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!dogProfileId) {
      return NextResponse.json({ error: "dogProfileId is required" }, { status: 400 });
    }

    const profile = await getOwnedProfile(userId, dogProfileId);
    if (!profile) return NextResponse.json({ error: "Dog profile not found" }, { status: 404 });

    const { error: updateError } = await supabaseAdmin
      .from("dog_profiles")
      .update({ profile_image_path: null, updated_at: new Date().toISOString() })
      .eq("id", dogProfileId)
      .eq("clerk_user_id", userId);

    if (updateError) {
      console.error("Dog photo removal update failed:", updateError);
      return NextResponse.json({ error: "Unable to remove dog photo." }, { status: 500 });
    }

    if (profile.profile_image_path) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([profile.profile_image_path]);

      if (removeError) console.error("Dog photo storage cleanup failed:", removeError);
    }

    return NextResponse.json({ profileImagePath: null, profileImageUrl: null });
  } catch (error) {
    console.error("Dog photo removal crashed:", error);
    return NextResponse.json({ error: "Unable to remove dog photo." }, { status: 500 });
  }
}
