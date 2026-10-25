import { AdminAuthorizationError, requireAdmin } from '@/lib/admin';
import { bookingDb, sendBookingMail, uuidPattern } from '@/lib/bookings';
export const dynamic = 'force-dynamic';
function failure(error: unknown) {
  if (error instanceof AdminAuthorizationError) return Response.json({error:error.message},{status:error.status});
  return Response.json({error:error instanceof Error ? error.message : 'Unable to update bookings.'},{status:400});
}
export async function GET() {
  try {
    await requireAdmin();
    const [slots,requests,mail] = await Promise.all([
      bookingDb(`booking_slots?select=*&starts_at=gt.${encodeURIComponent(new Date().toISOString())}&order=starts_at.asc&limit=500`),
      bookingDb('booking_requests?select=*,booking_slots(starts_at,ends_at)&order=created_at.desc&limit=1000'),
      bookingDb('booking_mail?select=request_id,kind,state,attempts&state=in.(pending,sending)&limit=2000'),
    ]);
    return Response.json({slots,requests,mail},{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    await requireAdmin();
    if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({error:'Please use the booking page to make changes.'},{status:403});
    const raw = await request.text();
    if (raw.length>2000) return Response.json({error:'Request too large.'},{status:413});
    const body = JSON.parse(raw);
    if (body.action === 'publish') {
      const start = new Date(body.startsAt);
      if (!Number.isFinite(start.getTime())) throw new Error('Choose a valid date and time.');
      await bookingDb('rpc/booking_slot','POST',{p_start:start.toISOString(),p_end:new Date(start.getTime()+60*60*1000).toISOString()});
      return Response.json({success:true});
    }
    if (typeof body.id !== 'string' || !uuidPattern.test(body.id)) throw new Error('Choose a valid request or time.');
    if (body.action === 'remove') {
      await bookingDb('rpc/booking_slot','POST',{p_slot:body.id});
      return Response.json({success:true});
    }
    if (!['approved','declined','cancelled','retry'].includes(body.action)) throw new Error('Invalid action.');
    if (body.action !== 'retry') await bookingDb('rpc/booking_decide','POST',{p_request:body.id,p_action:body.action});
    let mailSent = false;
    try { mailSent = await sendBookingMail(body.id); } catch { /* Saved decisions do not depend on email delivery. */ }
    return Response.json({success:true,mailSent});
  } catch(error) { return failure(error); }
}
