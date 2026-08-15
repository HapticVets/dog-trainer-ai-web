import { supabaseAdmin } from "@/lib/supabase-admin";

export type ClientHomeworkContext = {
  homework_focus: string;
  homework_notes: string | null;
  created_at: string;
};

export async function getActiveClientHomeworkContext(userId: string, dogProfileId: string) {
  const { data: link, error: linkError } = await supabaseAdmin
    .from("admin_client_dog_links")
    .select("admin_dog_id, customer_dog_profile_id")
    .eq("customer_clerk_user_id", userId)
    .eq("customer_dog_profile_id", dogProfileId)
    .maybeSingle();

  if (linkError || !link) return null;

  const { data, error } = await supabaseAdmin
    .from("client_homework_context")
    .select("homework_focus, homework_notes, created_at")
    .eq("admin_dog_id", link.admin_dog_id)
    .eq("customer_dog_profile_id", dogProfileId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Unable to load approved client homework context", { code: error.code, message: error.message });
    return null;
  }

  return data as ClientHomeworkContext | null;
}
