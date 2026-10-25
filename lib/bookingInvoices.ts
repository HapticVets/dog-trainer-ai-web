import Stripe from 'stripe';
import {bookingDb,sendBookingMail,uuidPattern} from '@/lib/bookings';
export const PRIVATE_LESSON_PRICE='price_1TTDmYRIXz9nyQVTJQOFj2oQ';
export type InvoiceBooking={id:string;slot_id:string;status:string;details:Record<string,string>;amount_due_cents:number;amount_paid_cents:number;payment_due_at:string;invoice_prepared_at:string;stripe_invoice_id:string|null;stripe_customer_id:string|null;invoice_sent_at:string|null;invoice_url:string|null;paid_at:string|null;booking_slots:{starts_at:string;ends_at:string}};
export async function getInvoiceBooking(id:string){
  if(!uuidPattern.test(id))throw new Error('A valid request number is required.');
  const [row]=await bookingDb<InvoiceBooking[]>(`booking_requests?id=eq.${id}&select=*,booking_slots(starts_at,ends_at)`);
  if(!row)throw new Error('Booking request not found.');return row;
}
export async function prepareBookingInvoice(stripe:Stripe,id:string){
  if(process.env.BOOKING_INVOICES_ENABLED!=='true')throw new Error('Invoice-first booking is not enabled yet.');
  let booking=await getInvoiceBooking(id);
  if(!['pending','awaiting_payment'].includes(booking.status))throw new Error('This request is not awaiting an invoice.');
  // Verify billing before creating a hold. This never charges a saved card.
  const [account,price]=await Promise.all([stripe.accounts.retrieve(),stripe.prices.retrieve(PRIVATE_LESSON_PRICE)]);
  if(!account.charges_enabled||price.unit_amount!==12000||price.currency!=='usd'||price.recurring||!price.active)throw new Error('Confirm the active $120 one-time training price and Stripe payment readiness.');
  const deadline=Math.min(Date.now()+24*3600000,new Date(booking.booking_slots.starts_at).getTime());
  await bookingDb('rpc/booking_invoice_prepare','POST',{p_request:id,p_due_at:new Date(deadline).toISOString()});
  booking=await getInvoiceBooking(id);
  if(new Date(booking.payment_due_at).getTime()<=Date.now())throw new Error('The payment deadline has passed. Close this hold and arrange a new time.');
  let invoice:Stripe.Invoice;
  if(booking.stripe_invoice_id)invoice=await stripe.invoices.retrieve(booking.stripe_invoice_id);
  else {
    if(Date.now()-new Date(booking.invoice_prepared_at).getTime()>23*3600000)throw new Error('Review the earlier invoice attempt in Stripe before retrying.');
    const customers=await stripe.customers.list({email:booking.details.email,limit:10});
    if(customers.data.length>1)throw new Error('Multiple Stripe customers match this email; choose the correct customer before invoicing.');
    const customer=customers.data[0]??await stripe.customers.create({email:booking.details.email,name:booking.details.name,metadata:{purpose:'patriot_k9_training'}},{idempotencyKey:`booking-customer-${id}`});
    if(customer.balance!==0)throw new Error('This customer has a Stripe balance. Review it before creating a full-price session invoice.');
    const time=new Date(booking.booking_slots.starts_at).toLocaleString('en-US',{timeZone:'America/New_York',dateStyle:'full',timeStyle:'short'});
    invoice=await stripe.invoices.create({customer:customer.id,collection_method:'send_invoice',auto_advance:false,pending_invoice_items_behavior:'exclude',currency:'usd',discounts:'',due_date:Math.floor(new Date(booking.payment_due_at).getTime()/1000),description:`Private training — ${time} Eastern. Dog: ${booking.details.dogName}. Time held pending full payment; this invoice is not appointment confirmation.`,footer:`Pay in full by ${new Date(booking.payment_due_at).toLocaleString('en-US',{timeZone:'America/New_York',dateStyle:'full',timeStyle:'short'})} Eastern to confirm. Unpaid invoices are voided before the hold is released. If you already have prepaid lessons, contact John before paying again. Payment does not activate included AI access.`,metadata:{purpose:'patriot_k9_booking',booking_request_id:id},payment_settings:{payment_method_types:['card']}},{idempotencyKey:`booking-invoice-${id}`});
    await bookingDb('rpc/booking_invoice_attach','POST',{p_request:id,p_invoice:invoice.id,p_customer:customer.id});
  }
  if(invoice.metadata?.purpose!=='patriot_k9_booking'||invoice.metadata.booking_request_id!==id)throw new Error('Invoice metadata does not match this booking.');
  if(invoice.status==='draft'){
    if(!invoice.lines.data.some(line=>line.metadata?.booking_request_id===id)){
      await stripe.invoiceItems.create({customer:String(invoice.customer),invoice:invoice.id,pricing:{price:PRIVATE_LESSON_PRICE},quantity:1,discountable:false,metadata:{booking_request_id:id}},{idempotencyKey:`booking-invoice-line-${id}`});
    }
    invoice=await stripe.invoices.retrieve(invoice.id);
    if(invoice.total!==12000||invoice.amount_due!==12000||invoice.currency!=='usd')throw new Error('Invoice total differs from $120. Review the draft before sending it.');
    invoice=await stripe.invoices.finalizeInvoice(invoice.id,{auto_advance:false},{idempotencyKey:`booking-invoice-finalize-${id}`});
  }
  if(invoice.status!=='open'||invoice.amount_due!==12000||invoice.currency!=='usd'||!invoice.hosted_invoice_url)throw new Error('Invoice is not an open $120 invoice. Review it in Stripe.');
  await bookingDb('rpc/booking_invoice_attach','POST',{p_request:id,p_invoice:invoice.id,p_customer:String(invoice.customer),p_url:invoice.hosted_invoice_url,p_number:invoice.number});
  if(!booking.invoice_sent_at){
    await stripe.invoices.sendInvoice(invoice.id,{}, {idempotencyKey:`booking-invoice-send-${id}`});
    await bookingDb(`booking_requests?id=eq.${id}`,'PATCH',{invoice_sent_at:new Date().toISOString()});
  }
  return {requestId:id,status:'awaiting_payment',invoiceId:invoice.id,invoiceNumber:invoice.number,paymentUrl:invoice.hosted_invoice_url,amountDue:120,currency:'USD',paymentDeadline:booking.payment_due_at};
}
export async function handleBookingInvoice(stripe:Stripe,invoice:Stripe.Invoice,eventId:string){
  if(invoice.metadata?.purpose!=='patriot_k9_booking')return null;
  const id=invoice.metadata.booking_request_id;if(!id||!uuidPattern.test(id))throw new Error('Invalid booking invoice reference.');
  const current=await stripe.invoices.retrieve(invoice.id);
  if(current.metadata?.booking_request_id!==id)throw new Error('Invoice reference changed.');
  let result:InvoiceBooking|null=null;
  if(current.status==='paid'&&current.amount_remaining===0){
    result=await bookingDb<InvoiceBooking>('rpc/booking_invoice_paid','POST',{p_request:id,p_invoice:current.id,p_amount:current.amount_paid,p_total:current.amount_due,p_currency:current.currency,p_event:eventId,p_paid_at:current.status_transitions.paid_at?new Date(current.status_transitions.paid_at*1000).toISOString():null});
  }else if(current.status==='void')result=await bookingDb<InvoiceBooking>('rpc/booking_invoice_voided','POST',{p_request:id,p_invoice:current.id});
  if(result){const sent=await sendBookingMail(id);if(!sent)throw new Error('Booking saved; notification delivery needs retry.');}
  return result;
}
export async function closeBookingInvoice(stripe:Stripe,id:string,decision:'cancelled'|'declined'|'expired'){
  const booking=await getInvoiceBooking(id);
  if(booking.status==='awaiting_payment'&&booking.stripe_invoice_id){
    let invoice=await stripe.invoices.retrieve(booking.stripe_invoice_id);
    if(invoice.metadata?.purpose!=='patriot_k9_booking'||invoice.metadata.booking_request_id!==id)throw new Error('Invoice does not match this booking; it has not been changed.');
    if(invoice.status==='paid'){await handleBookingInvoice(stripe,invoice,`reconcile-${invoice.id}`);throw new Error('Payment has arrived. Review the paid booking before cancelling; no refund was issued.');}
    if(invoice.status==='draft'){
      // Finalize to an open invoice, then void: preserves the invoice audit trail.
      invoice=await stripe.invoices.finalizeInvoice(invoice.id,{auto_advance:false},{idempotencyKey:`booking-close-finalize-${id}`});
    }
    if(invoice.status==='open')invoice=await stripe.invoices.voidInvoice(invoice.id,{}, {idempotencyKey:`booking-void-${id}`});
    if(invoice.status!=='void')throw new Error('The invoice is still payable; the hold has not been released.');
    await bookingDb('rpc/booking_invoice_voided','POST',{p_request:id,p_invoice:invoice.id});
  }
  if(decision!=='expired')await bookingDb('rpc/booking_decide','POST',{p_request:id,p_action:decision});
  return {requestId:id,decision,notificationSent:await sendBookingMail(id),refundIssued:false};
}
export async function expireUnpaidInvoices(stripe:Stripe){
  const rows=await bookingDb<InvoiceBooking[]>(`booking_requests?status=eq.awaiting_payment&payment_due_at=lt.${encodeURIComponent(new Date().toISOString())}&select=*,booking_slots(starts_at,ends_at)&limit=25`);
  const results=[];
  for(const row of rows){try{
    if(!row.stripe_invoice_id){await bookingDb('rpc/booking_invoice_attention','POST',{p_request:row.id});results.push({id:row.id,review:'Draft invoice creation needs review; hold retained.'});continue;}
    results.push(await closeBookingInvoice(stripe,row.id,'expired'));
  }catch{results.push({id:row.id,review:'Invoice could not be safely closed; review in Stripe.'});}}
  const mail=await bookingDb<{request_id:string}[]>(`booking_mail?state=in.(pending,sending)&created_at=gt.${encodeURIComponent(new Date(Date.now()-23*3600000).toISOString())}&select=request_id&limit=25`);
  for(const id of new Set(mail.map(m=>m.request_id))){try{await sendBookingMail(id);}catch{ /* Persisted outbox remains available for another retry. */ }}
  return results;
}
