import { redirect } from 'next/navigation';
import { AdminAuthorizationError, requireAdmin } from '@/lib/admin';
import AdminBookings from '@/components/AdminBookings';
export default async function BookingsPage() {
  try { await requireAdmin(); }
  catch(error) { if(error instanceof AdminAuthorizationError) redirect(error.status===401?'/sign-in':'/dashboard'); throw error; }
  return <AdminBookings />;
}
