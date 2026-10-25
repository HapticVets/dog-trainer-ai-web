// Server only. Never import this module from a client component.
type Slot = { id: string; starts_at: string; ends_at: string };
type Booking = { id: string; status: string; slot_id: string; details: Record<string,string>; amount_paid_cents?:number; invoice_number?:string; stripe_invoice_id?:string };
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
  const rows = await bookingDb<Slot[]>('rpc/booking_available','POST',{});
  return rows.map(({id,starts_at,ends_at}) => ({id,starts_at,ends_at}));
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
      const owner = ['owner','paid_owner','payment_issue'].includes(job.kind);
      const subject = job.kind === 'paid_owner' ? `Training payment received: ${details.name}` : job.kind === 'payment_issue' ? `Booking payment needs review: ${details.name}` : owner ? `Training appointment request: ${details.name}` : `Patriot K9 appointment ${job.kind}`;
      const text = job.kind === 'paid_owner' ? `Payment received and appointment confirmed.\nCustomer: ${details.name}\nEmail: ${details.email}\nDog: ${details.dogName}\nAppointment: ${formatTime(slot)}\nReceived: $${((booking.amount_paid_cents||0)/100).toFixed(2)} USD\nStripe invoice: ${booking.invoice_number||booking.stripe_invoice_id}\nRequest number: ${booking.id}\n\nAsk your assistant to update the Google Calendar hold and existing customer tracker to Booked/Paid. Payment does not activate included AI access.` : job.kind === 'payment_issue' ? `An invoice or payment needs manual booking review. Do not promise an appointment or issue an automatic refund.\nRequest: ${booking.id}\nCustomer: ${details.name} (${details.email})\nRequested time: ${formatTime(slot)}\nStripe invoice: ${booking.invoice_number||booking.stripe_invoice_id}\nCheck payment timing, amount and availability in Stripe, then contact the customer.` : job.kind === 'expired' ? `Hi ${details.name},\n\nThe unpaid invoice for ${formatTime(slot)} has been closed and your temporary appointment hold has been released. No appointment is confirmed. Please request a new time or contact John at (813) 299-6905.\n\nPatriot K9 Command` : owner
        ? `A customer requested ${formatTime(slot)}. This is pending your approval.\nRequest number: ${booking.id}\n\n${Object.entries(details).filter(([k])=>!['bookingSlot','submissionId'].includes(k)).map(([k,v])=>`${k}: ${v}`).join('\n')}\n\nTo approve or decline, tell your assistant the request number and your decision. Approval sends a Stripe invoice and temporarily holds the time. The appointment is confirmed only after full payment. You do not need to use the website admin area.`
        : `Hi ${details.name},\n\n${job.kind === 'approved' ? 'Your full session payment has been received and your 60-minute private training appointment is confirmed.' : job.kind === 'cancelled' ? 'Your training appointment has been cancelled.' : 'We cannot confirm the time you requested. Please contact us to arrange another time.'}\n\n${formatTime(slot)}\nDog: ${details.dogName}${job.kind === 'approved' ? `\nPayment received: $${((booking.amount_paid_cents||0)/100).toFixed(2)} USD\nStripe invoice: ${booking.invoice_number||booking.stripe_invoice_id||'See your Stripe receipt'}` : ''}${job.kind === 'approved' ? `\n\nBEFORE YOUR APPOINTMENT\nLocation: Patriot K9 Command, 4277 Lisbon Road, Leetonia, OH 44431. Visits are by appointment only. Text John when you arrive and keep your dog on a leash.\nBring your usual leash and collar or harness, small training treats your dog normally eats, water, and any current training notes. Have vaccination records available and ask John about any specific requirements before your first visit.\n\nAI HOMEWORK FOR ACTIVE TRAINING CLIENTS\nIncluded AI access is for clients John is actively training. Evaluation-only visits do not include AI access, and booking alone does not activate it. Independent AI use is $20 per month.\nHome practice is part of your Patriot K9 training. Set up your account using the same email as this booking: https://app.patriotk9kennel.com/client-start\nAdd your dog profile, then let John know so he can link your included client access and assign homework. Do not buy a separate AI subscription for your included client access.\nBetween lessons, follow John's assigned exercises and log your sessions, wins, and difficulties in the AI Trainer. John can review your logged activity and reported results before the next lesson. Consistent practice helps you get more from each paid lesson; progress and the number of lessons needed vary.\n\nJOIN OUR DOG COMMUNITY\nYou are invited to Patriot K9 Kennel on Discord: https://discord.gg/Mmb4KSp9Y8\nIntroduce your dog, connect with other owners, and share training progress. Discord is optional and separate from AI Trainer access. Keep assigned homework and practice logs in the AI Trainer for John to review.\n\nCHANGES & PAYMENT\nIf you need to cancel or reschedule, contact John as soon as possible. Your single-session invoice is paid. Contact John about any future package arrangements.` : ''}\n\nPlease call or text (813) 299-6905 for questions, location details, or changes. Payments and receipts are handled through Stripe invoices.\n\nJohn Reese\nPatriot K9 Command`;
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
