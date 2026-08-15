import { redirect } from "next/navigation";
import AdminDogCaseFile from "@/components/AdminDogCaseFile";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";

export default async function AdminDogCaseFilePage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthorizationError) redirect(error.status === 401 ? "/sign-in" : "/dashboard");
    throw error;
  }

  const { id } = await params;
  return <AdminDogCaseFile dogId={id} />;
}
