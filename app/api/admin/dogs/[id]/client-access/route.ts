import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = { params: Promise<{ id: string }> };

const getClientDog = async (id: string) => supabaseAdmin
  .from("dog_profiles")
  .select("id, client_owner_email")
  .eq("id", id)
  .eq("record_type", "client")
  .maybeSingle();

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { data: dog } = await getClientDog(id);
    if (!dog) return NextResponse.json({ error: "Client dog record not found." }, { status: 404 });

    const { data: link, error } = await supabaseAdmin
      .from("admin_client_dog_links")
      .select("customer_clerk_user_id, customer_dog_profile_id")
      .eq("admin_dog_id", id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: "Client access schema is not available." }, { status: 503 });

    if (!link) return NextResponse.json({ link: null, customerProfiles: [], clientAccess: false });

    const client = await clerkClient();
    const customer = await client.users.getUser(link.customer_clerk_user_id);
    const { data: customerProfiles } = await supabaseAdmin
      .from("dog_profiles")
      .select("id, name")
      .eq("clerk_user_id", link.customer_clerk_user_id)
      .is("record_type", null)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      link,
      customerProfiles: customerProfiles ?? [],
      clientAccess: customer.publicMetadata?.clientAccess === true,
    });
  } catch (error) {
    console.error("Admin client access load failed", error);
    return NextResponse.json({ error: "Unable to load client access." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const adminId = await requireAdmin();
    const { id } = await params;
    const { data: dog } = await getClientDog(id);
    if (!dog) return NextResponse.json({ error: "Client dog record not found." }, { status: 404 });
    const body = await request.json() as { action?: string; email?: string; customerDogProfileId?: string };
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("admin_client_dog_links")
      .select("customer_clerk_user_id, customer_dog_profile_id")
      .eq("admin_dog_id", id)
      .maybeSingle();
    if (existingError) return NextResponse.json({ error: "Client access schema is not available." }, { status: 503 });

    const client = await clerkClient();
    if (body.action === "link_account") {
      const email = body.email?.trim().toLowerCase();
      if (!email) return NextResponse.json({ error: "Client email is required." }, { status: 400 });
      const users = await client.users.getUserList({ emailAddress: [email], limit: 2 });
      const customer = users.data[0];
      if (!customer || users.data.length !== 1) return NextResponse.json({ error: "No unique Clerk account was found for that email." }, { status: 404 });
      const payload = {
        admin_dog_id: id,
        customer_clerk_user_id: customer.id,
        customer_dog_profile_id: existing?.customer_clerk_user_id === customer.id ? existing.customer_dog_profile_id : null,
        created_by_clerk_user_id: adminId,
        updated_at: new Date().toISOString(),
      };
      const { error } = existing
        ? await supabaseAdmin.from("admin_client_dog_links").update(payload).eq("admin_dog_id", id)
        : await supabaseAdmin.from("admin_client_dog_links").insert(payload);
      if (error) return NextResponse.json({ error: "Unable to link the client account." }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (!existing) return NextResponse.json({ error: "Link a client account first." }, { status: 400 });
    if (body.action === "link_dog") {
      const { data: customerDog } = await supabaseAdmin
        .from("dog_profiles").select("id")
        .eq("id", body.customerDogProfileId ?? "")
        .eq("clerk_user_id", existing.customer_clerk_user_id).is("record_type", null).maybeSingle();
      if (!customerDog) return NextResponse.json({ error: "Choose one of the linked client's dog profiles." }, { status: 400 });
      const { error } = await supabaseAdmin.from("admin_client_dog_links")
        .update({ customer_dog_profile_id: customerDog.id, updated_at: new Date().toISOString() }).eq("admin_dog_id", id);
      if (error) return NextResponse.json({ error: "Unable to link the customer dog profile." }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (body.action === "grant_access" || body.action === "revoke_access") {
      if (body.action === "revoke_access") {
        const { count, error: linkCountError } = await supabaseAdmin
          .from("admin_client_dog_links")
          .select("*", { count: "exact", head: true })
          .eq("customer_clerk_user_id", existing.customer_clerk_user_id)
          .neq("admin_dog_id", id);
        if (linkCountError) return NextResponse.json({ error: "Unable to verify the client's other links." }, { status: 500 });
        if ((count ?? 0) > 0) return NextResponse.json({ error: "Remove the client's other active dog links before revoking account access." }, { status: 400 });
      }
      const customer = await client.users.getUser(existing.customer_clerk_user_id);
      await client.users.updateUserMetadata(customer.id, {
        publicMetadata: { ...customer.publicMetadata, clientAccess: body.action === "grant_access" },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported client access action." }, { status: 400 });
  } catch (error) {
    console.error("Admin client access update failed", error);
    return NextResponse.json({ error: "Unable to update client access." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { data: dog } = await getClientDog(id);
    if (!dog) return NextResponse.json({ error: "Client dog record not found." }, { status: 404 });
    const { error } = await supabaseAdmin.from("admin_client_dog_links").delete().eq("admin_dog_id", id);
    if (error) return NextResponse.json({ error: "Unable to remove the client link." }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin client link removal failed", error);
    return NextResponse.json({ error: "Unable to remove the client link." }, { status: 500 });
  }
}
