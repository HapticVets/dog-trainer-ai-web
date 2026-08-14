import { redirect } from "next/navigation";
import AdminDogWorkspace from "@/components/AdminDogWorkspace";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthorizationError) {
      redirect(error.status === 401 ? "/sign-in" : "/dashboard");
    }

    throw error;
  }

  return <AdminDogWorkspace />;
}
