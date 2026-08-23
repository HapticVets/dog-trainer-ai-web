import { redirect } from "next/navigation";
import AdminPromotionalTrials from "@/components/AdminPromotionalTrials";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";

export default async function AdminPromotionalTrialsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthorizationError) redirect(error.status === 401 ? "/sign-in" : "/dashboard");
    throw error;
  }
  return <AdminPromotionalTrials />;
}
