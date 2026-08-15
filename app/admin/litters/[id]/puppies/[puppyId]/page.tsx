import { redirect } from "next/navigation";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import AdminPuppyCaseFile from "@/components/AdminPuppyCaseFile";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; puppyId: string }>;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      redirect(error.status === 401 ? "/sign-in" : "/dashboard");
    }
    throw error;
  }

  const { id, puppyId } = await params;
  return <AdminPuppyCaseFile litterId={id} puppyId={puppyId} />;
}
