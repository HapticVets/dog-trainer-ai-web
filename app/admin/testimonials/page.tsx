import { redirect } from "next/navigation";
import AdminTestimonials from "@/components/AdminTestimonials";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";

export default async function AdminTestimonialsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthorizationError) redirect(error.status === 401 ? "/sign-in" : "/dashboard");
    throw error;
  }
  return <AdminTestimonials />;
}
