import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import crypto from 'node:crypto';
function load(file,imports={},globals={}){const exports={};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{exports,require:n=>{if(n in imports)return imports[n];throw Error('Unexpected import '+n);},Request,Response,URL,Date,Intl,Buffer,console,...globals});return exports;}
const id='10000000-0000-4000-8000-000000000001';
function harness({total=12000,invoiceStatus='draft'}={}){
  const booking={id,slot_id:id,status:'pending',details:{email:'test@example.com',name:'Test Only',dogName:'Test Dog'},amount_due_cents:12000,amount_paid_cents:0,stripe_invoice_id:null,invoice_prepared_at:new Date().toISOString(),booking_slots:{starts_at:new Date(Date.now()+3*86400000).toISOString()}};
  const calls=[];let invoice={id:'in_test',customer:'cus_test',status:invoiceStatus,metadata:{purpose:'patriot_k9_booking',booking_request_id:id},total,amount_due:total,amount_paid:0,amount_remaining:total,currency:'usd',lines:{data:[]},hosted_invoice_url:'https://invoice.stripe.com/test',number:'TEST-001',status_transitions:{paid_at:null}};
  const stripe={accounts:{retrieve:async()=>({charges_enabled:true})},prices:{retrieve:async()=>({unit_amount:12000,currency:'usd',active:true,recurring:null})},customers:{list:async()=>({data:[{id:'cus_test',balance:0}]})},invoiceItems:{create:async(params)=>{calls.push(['line',params]);invoice.lines.data=[{metadata:{booking_request_id:id}}];}},invoices:{create:async(params)=>{calls.push(['create',params]);return invoice;},retrieve:async()=>({...invoice}),finalizeInvoice:async()=>{calls.push(['finalize']);invoice.status='open';return invoice;},sendInvoice:async()=>{calls.push(['send']);return invoice;},voidInvoice:async()=>{calls.push(['void']);invoice.status='void';return invoice;}}};
  const bookingDb=async(path,method,body)=>{calls.push(['db',path,body]);if(path.startsWith('booking_requests?')){if(method==='PATCH')Object.assign(booking,body);return[booking];}if(path==='rpc/booking_invoice_prepare'){booking.status='awaiting_payment';booking.payment_due_at=body.p_due_at;return booking;}if(path==='rpc/booking_invoice_attach'){booking.stripe_invoice_id=body.p_invoice;return booking;}if(path==='rpc/booking_invoice_paid'){booking.status='approved';return booking;}if(path==='rpc/booking_invoice_voided'){booking.status='expired';return booking;}return booking;};
  const api=load('lib/bookingInvoices.ts',{'@/lib/bookings':{bookingDb,sendBookingMail:async()=>true,uuidPattern:/^[0-9a-f-]{36}$/}},{process:{env:{BOOKING_INVOICES_ENABLED:'true'}}});
  return{api,booking,calls,stripe,invoice};
}
test('approval sends a one-time full-price Stripe invoice and does not confirm the visit',async()=>{
  const h=harness();const result=await h.api.prepareBookingInvoice(h.stripe,id);
  assert.equal(result.status,'awaiting_payment');assert.equal(result.amountDue,120);assert.equal(h.booking.status,'awaiting_payment');
  const create=h.calls.find(c=>c[0]==='create')[1];assert.equal(create.collection_method,'send_invoice');assert.equal(create.auto_advance,false);assert.equal(create.pending_invoice_items_behavior,'exclude');assert.equal(create.subscription,undefined);assert.equal(create.metadata.purpose,'patriot_k9_booking');
  assert.equal(h.calls.find(c=>c[0]==='line')[1].pricing.price,'price_1TTDmYRIXz9nyQVTJQOFj2oQ');
  assert.ok(h.calls.findIndex(c=>c[1]==='rpc/booking_invoice_attach')<h.calls.findIndex(c=>c[0]==='send'));
  await h.api.prepareBookingInvoice(h.stripe,id);assert.equal(h.calls.filter(c=>c[0]==='create').length,1);assert.equal(h.calls.filter(c=>c[0]==='send').length,1);
});
test('wrong invoice total is never finalized or emailed',async()=>{const h=harness({total:1000});await assert.rejects(h.api.prepareBookingInvoice(h.stripe,id),/total differs/);assert.equal(h.calls.filter(c=>['send','finalize'].includes(c[0])).length,0);});
test('unpaid invoice events cannot confirm a booking; paid invoices are checked against Stripe',async()=>{
  const h=harness();h.invoice.status='open';assert.equal(await h.api.handleBookingInvoice(h.stripe,h.invoice,'evt_unpaid'),null);assert.ok(!h.calls.some(c=>c[1]==='rpc/booking_invoice_paid'));
  h.invoice.status='paid';h.invoice.amount_remaining=0;h.invoice.amount_paid=12000;h.invoice.status_transitions.paid_at=Math.floor(Date.now()/1000);
  await h.api.handleBookingInvoice(h.stripe,h.invoice,'evt_paid');assert.ok(h.calls.some(c=>c[1]==='rpc/booking_invoice_paid'));
});
test('void is verified before an unpaid invoice hold is released',async()=>{const h=harness({invoiceStatus:'open'});h.booking.status='awaiting_payment';h.booking.stripe_invoice_id='in_test';await h.api.closeBookingInvoice(h.stripe,id,'expired');assert.ok(h.calls.findIndex(c=>c[0]==='void')<h.calls.findIndex(c=>c[1]==='rpc/booking_invoice_voided'));});
test('private booking operations reject missing, forged and stale signatures',()=>{
  const secret='test-secret',raw='{"action":"health"}',stamp=String(Date.now());const sign=t=>crypto.createHmac('sha256',secret).update(`${t}.${raw}`).digest('hex');
  const api=load('lib/bookingOperationAuth.ts',{'node:crypto':crypto},{process:{env:{BOOKING_AUTOMATION_SECRET:secret}}});
  assert.equal(api.authorizedBookingOperation(raw,stamp,sign(stamp)),true);assert.equal(api.authorizedBookingOperation(raw,stamp,'0'.repeat(64)),false);assert.equal(api.authorizedBookingOperation(raw,null,null),false);const old=String(Date.now()-360000);assert.equal(api.authorizedBookingOperation(raw,old,sign(old)),false);
});
