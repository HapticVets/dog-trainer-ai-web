import { supabaseAdmin } from "@/lib/supabase-admin";

/** Customer routes may only use profiles explicitly outside the internal admin workspace. */
export async function getOwnedCustomerDog(userId: string, dogId: string) {
  const { data, error } = await supabaseAdmin
    .from("dog_profiles")
    .select("*")
    .eq("id", dogId)
    .eq("clerk_user_id", userId)
    .is("record_type", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getOwnedCustomerDogIds(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("dog_profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .is("record_type", null);

  if (error) throw new Error(error.message);
  return (data ?? []).map((dog) => dog.id);
}
