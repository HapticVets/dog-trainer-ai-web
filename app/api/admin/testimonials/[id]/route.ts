import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import { parseTestimonialFields, testimonialColumns, type Testimonial, type TestimonialStatus } from "@/lib/testimonials";
import { supabaseAdmin } from "@/lib/supabase-admin";

const statuses = new Set<TestimonialStatus>(["pending", "approved", "rejected"]);

const authorizationResponse = (error: unknown) =>
  error instanceof AdminAuthorizationError
    ? NextResponse.json({ error: error.message }, { status: error.status })
    : null;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminId = await requireAdmin();
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("testimonials")
      .select("id, client_name, dog_name, rating, testimonial, source, client_email, admin_notes, status, is_featured")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });

    const fields = parseTestimonialFields({
      clientName: body.clientName ?? existing.client_name,
      dogName: body.dogName ?? existing.dog_name,
      rating: body.rating ?? existing.rating,
      testimonial: body.testimonial ?? existing.testimonial,
      source: body.source ?? existing.source,
      clientEmail: body.clientEmail ?? existing.client_email,
      adminNotes: body.adminNotes ?? existing.admin_notes,
    });
    const requestedStatus = typeof body.status === "string" ? body.status : existing.status;
    if (!statuses.has(requestedStatus as TestimonialStatus)) {
      return NextResponse.json({ error: "Unsupported testimonial status." }, { status: 400 });
    }
    const requestedFeatured = typeof body.isFeatured === "boolean" ? body.isFeatured : existing.is_featured;
    if (requestedFeatured && requestedStatus !== "approved") {
      return NextResponse.json({ error: "Only approved testimonials can be featured." }, { status: 400 });
    }

    const reviewing = requestedStatus === "approved" || requestedStatus === "rejected";
    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .update({
        ...fields,
        status: requestedStatus,
        is_featured: requestedStatus === "rejected" ? false : requestedFeatured,
        reviewed_at: reviewing ? new Date().toISOString() : null,
        reviewed_by_clerk_user_id: reviewing ? adminId : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(testimonialColumns)
      .single();
    if (error) throw error;
    return NextResponse.json({ testimonial: data as Testimonial });
  } catch (error) {
    const authorization = authorizationResponse(error);
    if (authorization) return authorization;
    if (error instanceof Error && /required|Rating/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Admin testimonial update failed", error);
    return NextResponse.json({ error: "Unable to update testimonial." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Testimonial not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const authorization = authorizationResponse(error);
    if (authorization) return authorization;
    console.error("Admin testimonial delete failed", error);
    return NextResponse.json({ error: "Unable to delete testimonial." }, { status: 500 });
  }
}
