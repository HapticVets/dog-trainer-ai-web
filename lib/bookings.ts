// Server only. Never import this module from a client component.
type Slot = { id: string; starts_at: string; ends_at: string };
type Booking = { id: string; status: string; slot_id: string; details: Record<string,string> };
export const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function bookingDb<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const url = process.env.BOOKING_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.BOOKING_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Booking service is unavailable. Please call or text us.');
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method, cache: 'no-store', signal: AbortSignal.timeout(10_000),
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (error.code === 'P0001') throw new Error(error.message);
    throw new Error('Booking service is temporarily unavailable. Please try again or contact us.');
  }
  const text = await response.text();
  return text ? JSON.parse(text) as T : undefined as T;
}
export async function availableSlots(): Promise<Slot[]> {
  const rows = await bookingDb<(Slot & { booking_requests: { status: string }[] })[]>(`booking_slots?select=id,starts_at,ends_at,booking_requests(status)&state=eq.open&starts_at=gt.${encodeURIComponent(new Date().toISOString())}&order=starts_at.asc&limit=500`);
  return rows.filter(s => !s.booking_requests.some(r => r.status === 'approved')).map(({id,starts_at,ends_at}) => ({id,starts_at,ends_at}));
}
export function requestBooking(slot: string, submission: string, details: unknown) {
  return bookingDb<Booking>('rpc/booking_request','POST',{p_slot:slot,p_submission:submission,p_details:details});
}
const formatTime = (s: Slot) => `${new Date(s.starts_at).toLocaleString('en-US',{timeZone:'America/New_York',dateStyle:'full',timeStyle:'short'})} – ${new Date(s.ends_at).toLocaleTimeString('en-US',{timeZone:'America/New_York',hour:'numeric',minute:'2-digit',timeZoneName:'short'})}`;
export async function sendBookingMail(requestId: string): Promise<boolean> {
  const from = process.env.RESEND_FROM_EMAIL;
  const key = process.env.RESEND_API_KEY;
  if (!from || !key) return false;
  const jobs = await bookingDb<{id:string;kind:string}[]>('rpc/booking_claim_mail','POST',{p_request:requestId});
  let success = true;
  for (const job of jobs) {
    try {
      const [booking] = await bookingDb<Booking[]>(`booking_requests?id=eq.${requestId}&select=*`);
      const [slot] = await bookingDb<Slot[]>(`booking_slots?id=eq.${booking.slot_id}&select=id,starts_at,ends_at`);
      const details = booking.details;
      const owner = job.kind === 'owner';
      const subject = owner ? `Training appointment request: ${details.name}` : `Patriot K9 appointment ${job.kind}`;
      const text = owner
        ? `A customer requested ${formatTime(slot)}. This is pending your approval.\n\n${Object.entries(details).map(([k,v])=>`${k}: ${v}`).join('\n')}\n\nReview and approve or decline: https://app.patriotk9kennel.com/admin/bookings`
        : `Hi ${details.name},\n\n${job.kind === 'approved' ? 'Your 60-minute private training appointment is confirmed.' : job.kind === 'cancelled' ? 'Your training appointment has been cancelled.' : 'We cannot confirm the time you requested. Please contact us to arrange another time.'}\n\n${formatTime(slot)}\nDog: ${details.dogName}\n\nPlease call or text (813) 299-6905 for questions, location details, or changes. No payment was taken through this request.\n\nJohn Reese\nPatriot K9 Command`;
      const response = await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(15_000),headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`booking-${job.id}`},body:JSON.stringify({from,to:[owner ? process.env.TRAINING_INQUIRY_TO_EMAIL || 'jreese@hapticvets.com' : details.email],reply_to:owner ? details.email : 'jreese@hapticvets.com',subject,text})});
      if (!response.ok) throw new Error('Email delivery failed');
      await bookingDb(`booking_mail?id=eq.${job.id}`,'PATCH',{state:'sent',leased_until:null});
    } catch {
      success = false;
      // Leave an uncertain send leased; retries reuse the same provider idempotency key.
    }
  }
  const pending = await bookingDb<{kind:string}[]>(`booking_mail?request_id=eq.${requestId}&state=in.(pending,sending)&select=kind`);
  return success && pending.length === 0;
}
