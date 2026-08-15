import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; puppyId: string }> };
const bucket = "dog-profile-images";
const accepted = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
type Mime = keyof typeof accepted;

function isMime(value: string): value is Mime { return value in accepted; }
function isValidImage(buffer: Buffer, mime: Mime) {
  if (mime === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
}

async function findPuppy(litterId: string, puppyId: string) {
  return supabaseAdmin.from("admin_litter_puppies").select("id,profile_image_path").eq("id", puppyId).eq("litter_id", litterId).maybeSingle();
}

export async function POST(request: Request, { params }: Context) {
  try {
    const adminId = await requireAdmin();
    const { id: litterId, puppyId } = await params;
    const { data: puppy, error: puppyError } = await findPuppy(litterId, puppyId);
    if (puppyError || !puppy) return NextResponse.json({ error: "Puppy record not found." }, { status: 404 });
    const formData = await request.formData();
    const image = formData.get("image");
    if (!(image instanceof File) || !isMime(image.type) || image.size === 0 || image.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Choose a JPEG, PNG, or WebP image that is 5 MB or smaller." }, { status: 400 });
    const extension = image.name.split(".").pop()?.toLowerCase();
    if (extension !== accepted[image.type]) return NextResponse.json({ error: "The file extension must match the image type." }, { status: 400 });
    const buffer = Buffer.from(await image.arrayBuffer());
    if (!isValidImage(buffer, image.type)) return NextResponse.json({ error: "The selected image file appears to be malformed." }, { status: 400 });
    const path = `admin-litters/${litterId}/${puppyId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, { contentType: image.type, upsert: false });
    if (uploadError) { console.error("Admin puppy photo upload failed", uploadError); return NextResponse.json({ error: "Unable to upload puppy photo." }, { status: 500 }); }
    const { data, error: updateError } = await supabaseAdmin.from("admin_litter_puppies").update({ profile_image_path: path, updated_at: new Date().toISOString() }).eq("id", puppyId).eq("litter_id", litterId).select("*").single();
    if (updateError) { await supabaseAdmin.storage.from(bucket).remove([path]); console.error("Admin puppy photo update failed", updateError); return NextResponse.json({ error: "Unable to save puppy photo." }, { status: 500 }); }
    if (puppy.profile_image_path) { const { error } = await supabaseAdmin.storage.from(bucket).remove([puppy.profile_image_path]); if (error) console.error("Previous admin puppy photo cleanup failed", error); }
    const { data: signed, error: signedError } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 60 * 60);
    if (signedError) return NextResponse.json({ error: "Photo saved, but unable to load it." }, { status: 500 });
    return NextResponse.json({ success: true, puppy: data, profileImageUrl: signed.signedUrl, uploadedBy: adminId });
  } catch (error) { console.error("Admin puppy photo upload failed", error); return NextResponse.json({ error: "Unable to upload puppy photo." }, { status: 500 }); }
}
