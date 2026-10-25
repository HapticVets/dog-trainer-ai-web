import { redirect } from "next/navigation";
import Link from "next/link";
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

  return <><div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pt-5 sm:px-6"><Link href="/admin/litters" className="rounded-lg border border-amber-400/35 px-3 py-2 text-sm font-semibold text-amber-100">Litters</Link><Link href="/admin/trials" className="rounded-lg border border-amber-400/35 px-3 py-2 text-sm font-semibold text-amber-100">Trial QR Codes</Link><Link href="/admin/testimonials" className="rounded-lg border border-amber-400/35 px-3 py-2 text-sm font-semibold text-amber-100">Testimonials</Link></div><AdminDogWorkspace /></>;
}
