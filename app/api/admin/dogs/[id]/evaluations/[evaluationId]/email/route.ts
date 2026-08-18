import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { buildClientEvaluationEmail, safeEvaluationEmailInput } from "@/lib/clientEvaluationEmail";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Context = { params: Promise<{ id: string; evaluationId: string }> };
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

async function loadClientEvaluation(dogId: string, evaluationId: string) {
  const { data: dog, error: dogError } = await supabaseAdmin.from("dog_profiles").select("id,name,client_owner_email").eq("id", dogId).eq("record_type", "client").maybeSingle();
  if (dogError || !dog) return null;
  const { data: evaluation, error } = await supabaseAdmin.from("admin_dog_evaluations").select("id,title,evaluation_date,config_snapshot,results,trainer_summary").eq("id", evaluationId).eq("dog_id", dogId).maybeSingle();
  if (error || !evaluation) return null;
  return { dog, evaluation };
}

export async function POST(request: Request, { params }: Context) {
  try {
    const adminId = await requireAdmin(); const { id, evaluationId } = await params;
    const record = await loadClientEvaluation(id, evaluationId);
    if (!record) return NextResponse.json({ error: "Client evaluation not found." }, { status: 404 });
    const body = await request.json() as Record<string, unknown>;
    const recipient = typeof body.recipient === "string" ? body.recipient.trim().toLowerCase() : record.dog.client_owner_email?.trim().toLowerCase() ?? "";
    const introduction = typeof body.introduction === "string" ? body.introduction : "";
    const clientSummary = typeof body.client_summary === "string" ? body.client_summary : "";
    const includeTrainerNotes = body.include_trainer_notes === true;
    const emailInput = safeEvaluationEmailInput(record.evaluation, record.dog.name, introduction, clientSummary, includeTrainerNotes);
    if (!emailInput) return NextResponse.json({ error: "Saved evaluation data is invalid." }, { status: 400 });
    const message = buildClientEvaluationEmail(emailInput);
    if (body.action === "preview") return NextResponse.json({ recipient, subject: `${record.dog.name} Training Evaluation - Patriot K9 Command`, html: message.html, text: message.text, sections: message.sections });
    if (body.action !== "send") return NextResponse.json({ error: "Unsupported email action." }, { status: 400 });
    if (!isEmail(recipient)) return NextResponse.json({ error: "Enter a valid recipient email address." }, { status: 400 });
    const apiKey = process.env.RESEND_API_KEY; const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) return NextResponse.json({ error: "Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL on the server." }, { status: 503 });
    const subject = `${record.dog.name} Training Evaluation - Patriot K9 Command`;
    const providerResponse = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [recipient], subject, html: message.html, text: message.text }) });
    if (!providerResponse.ok) { const providerBody = await providerResponse.text(); console.error("Client evaluation email send failed", { status: providerResponse.status, body: providerBody.slice(0, 500) }); return NextResponse.json({ error: "Evaluation email could not be sent. Please try again." }, { status: 502 }); }
    const { error: auditError } = await supabaseAdmin.from("admin_dog_evaluation_email_sends").insert({ evaluation_id: record.evaluation.id, recipient_email: recipient, sent_by_clerk_user_id: adminId, included_trainer_notes: includeTrainerNotes, pdf_attached: false });
    if (auditError) { console.error("Client evaluation email audit failed", auditError); return NextResponse.json({ error: "Evaluation email was sent, but send history could not be recorded." }, { status: 500 }); }
    return NextResponse.json({ success: true, recipient });
  } catch (error) { console.error("Client evaluation email route failed", error); return NextResponse.json({ error: "Evaluation email could not be sent. Please try again." }, { status: 500 }); }
}
