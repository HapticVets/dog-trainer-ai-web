// Local assistant workflow only; never expose this script as a public endpoint.
import nextEnv from '@next/env';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {execFileSync} from 'node:child_process';
nextEnv.loadEnvConfig(process.cwd());
const exports={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/bookings.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,process,fetch,AbortSignal,Date,Response,console});
const {bookingDb,sendBookingMail,uuidPattern}=exports;
const [action,id,authorization]=process.argv.slice(2);
if (!['list','show','approve','decline','cancel','retry-email'].includes(action)) throw new Error('Use list, show ID, approve ID, decline ID, cancel ID, or retry-email ID.');
if(action==='list') {
  const requests=await bookingDb('booking_requests?select=id,status,details,created_at,booking_slots(starts_at,ends_at)&status=in.(pending,awaiting_payment,approved,payment_review)&order=created_at.desc&limit=200');
  console.log(JSON.stringify(requests,null,2));
} else {
  if(!uuidPattern.test(id||''))throw new Error('A complete request UUID is required.');
  if(action==='show') console.log(JSON.stringify(await bookingDb(`booking_requests?select=*,booking_slots(starts_at,ends_at)&id=eq.${id}`),null,2));
  else {
    if(authorization!=='--authorized-by-john')throw new Error('Process a decision only after John explicitly authorizes this specific request.');
    if(['approve','decline','cancel'].includes(action)){execFileSync(process.execPath,['scripts/booking-invoice-remote.mjs',action,id,'--authorized-by-john'],{stdio:'inherit'});process.exit(0);}
    if(action!=='retry-email') await bookingDb('rpc/booking_decide','POST',{p_request:id,p_action:{approve:'approved',decline:'declined',cancel:'cancelled'}[action]});
    const emailSent=await sendBookingMail(id);
    console.log(JSON.stringify({requestId:id,decisionSaved:true,emailSent,remainingSteps:'Check/create or update the Google Calendar event and update the existing customer tracker. Do not claim those steps are complete until readback verifies them.'}));
  }
}
