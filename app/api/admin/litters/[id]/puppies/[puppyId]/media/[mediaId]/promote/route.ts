import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; puppyId: string; mediaId: string }> };

export async function POST(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    const { id: litterId, puppyId, mediaId } = await params;
    const { data: media } = await supabaseAdmin.from("admin_puppy_media").select("storage_path,media_type").eq("id", mediaId).eq("litter_id", litterId).eq("puppy_id", puppyId).maybeSingle();
    if (!media || media.media_type !== "photo") return NextResponse.json({ error: "A development photo is required." }, { status: 400 });
    const { data: puppy } = await supabaseAdmin.from("admin_litter_puppies").select("profile_image_path").eq("id", puppyId).eq("litter_id", litterId).maybeSingle();
    if (!puppy) return NextResponse.json({ error: "Puppy record not found." }, { status: 404 });
    const { data: downloaded, error: downloadError } = await supabaseAdmin.storage.from("puppy-development-media").download(media.storage_path);
    if (downloadError || !downloaded) return NextResponse.json({ error: "Unable to read development photo." }, { status: 500 });
    const extension = media.storage_path.split(".").pop() || "jpg";
    const path = `admin-litters/${litterId}/${puppyId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage.from("dog-profile-images").upload(path, downloaded, { contentType: downloaded.type || "image/jpeg", upsert: false });
    if (uploadError) return NextResponse.json({ error: "Unable to promote development photo." }, { status: 500 });
    const { error: updateError } = await supabaseAdmin.from("admin_litter_puppies").update({ profile_image_path: path, updated_at: new Date().toISOString() }).eq("id", puppyId).eq("litter_id", litterId);
    if (updateError) { await supabaseAdmin.storage.from("dog-profile-images").remove([path]); return NextResponse.json({ error: "Unable to update current puppy photo." }, { status: 500 }); }
    if (puppy.profile_image_path) await supabaseAdmin.storage.from("dog-profile-images").remove([puppy.profile_image_path]);
    const { data: signed } = await supabaseAdmin.storage.from("dog-profile-images").createSignedUrl(path, 60 * 60);
    return NextResponse.json({ success: true, profileImageUrl: signed?.signedUrl ?? null, profileImagePath: path });
  } catch (error) { console.error("Admin puppy media promotion failed", error); return NextResponse.json({ error: "Unable to promote development photo." }, { status: 500 }); }
}
