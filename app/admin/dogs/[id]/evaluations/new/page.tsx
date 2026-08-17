import { redirect } from "next/navigation";
import AdminClientEvaluationEditor from "@/components/AdminClientEvaluationEditor";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";

export default async function Page({ params }: { params: Promise<{ id: string }> }) { try { await requireAdmin(); } catch (error) { if (error instanceof AdminAuthorizationError) redirect(error.status === 401 ? "/sign-in" : "/dashboard"); throw error; } const { id } = await params; return <AdminClientEvaluationEditor dogId={id} />; }
