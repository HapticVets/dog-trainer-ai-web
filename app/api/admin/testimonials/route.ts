import { NextResponse } from "next/server";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import { parseTestimonialFields, testimonialColumns, type Testimonial } from "@/lib/testimonials";
import { supabaseAdmin } from "@/lib/supabase-admin";

const unauthorizedResponse = (error: unknown) =>
  error instanceof AdminAuthorizationError
    ? NextResponse.json({ error: error.message }, { status: error.status })
    : null;

export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .select(testimonialColumns)
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ testimonials: (data ?? []) as Testimonial[] });
  } catch (error) {
    const authorization = unauthorizedResponse(error);
    if (authorization) return authorization;
    console.error("Admin testimonial load failed", error);
    return NextResponse.json({ error: "Unable to load testimonials. Confirm the testimonial migration is applied." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const fields = parseTestimonialFields(await request.json() as Record<string, unknown>);
    const { data, error } = await supabaseAdmin
      .from("testimonials")
      .insert({ ...fields, status: "pending", is_featured: false })
      .select(testimonialColumns)
      .single();
    if (error) throw error;
    return NextResponse.json({ testimonial: data as Testimonial }, { status: 201 });
  } catch (error) {
    const authorization = unauthorizedResponse(error);
    if (authorization) return authorization;
    if (error instanceof Error && /required|Rating/.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Admin testimonial creation failed", error);
    return NextResponse.json({ error: "Unable to create testimonial. Confirm the testimonial migration is applied." }, { status: 500 });
  }
}
